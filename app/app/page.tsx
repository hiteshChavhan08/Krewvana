// app/app/page.tsx
"use client";

// *** Keep ALL imports the same as your previous working version ***
import React, { useCallback, useEffect, useRef } from "react"; // Added useEffect, useRef
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import Link from "next/link";
import { ShoutoutType } from "@prisma/client";
import {
  Star,
  Award,
  ArrowRight,
  PartyPopper,
  Terminal,
  Lightbulb,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GiveKudosDialog } from "@/components/kudos/GiveKudosDialog";

// --- Type Definitions ---
// (Keep types as they were)
type UserProfileSubset = {
  name: string | null;
  points: number;
};

type ActivityItem = {
  id: string;
  type: "kudos" | "shoutout";
  message: string;
  createdAt: string;
  actorName: string | null;
  actorImage?: string | null;
  receiverName?: string | null;
  receiverImage?: string | null;
  shoutoutType?: string | null;
};

// --- API Fetch Functions ---
// (Keep fetch functions as they were)
async function fetchCurrentUserProfile(): Promise<UserProfileSubset> {
  const response = await fetch("/api/users/me");
  if (!response.ok) {
    const errorData = await response.text();
    console.error("Failed to fetch user data:", response.status, errorData);
    throw new Error(`Failed to fetch user data (status: ${response.status})`);
  }
  const data = await response.json();
  const points = typeof data.points === "number" ? data.points : 0;
  return { name: data.name, points: points };
}

async function fetchRecentActivity(limit: number = 5): Promise<ActivityItem[]> {
  try {
    const [kudosRes, shoutoutsRes] = await Promise.all([
      fetch(`/api/kudos?limit=${limit}`),
      fetch(`/api/shoutouts?limit=${limit}`),
    ]);

    if (!kudosRes.ok) console.warn("Failed to fetch kudos stream"); // Use warn for non-critical failures
    if (!shoutoutsRes.ok) console.warn("Failed to fetch shoutouts stream");

    const kudosData = kudosRes.ok ? await kudosRes.json() : [];
    const shoutoutsData = shoutoutsRes.ok ? await shoutoutsRes.json() : [];

    const combined: ActivityItem[] = [
      ...kudosData.map((k: any) => ({
        id: `k-${k.id}`,
        type: "kudos" as const,
        message: k.message || "",
        createdAt: k.createdAt,
        actorName: k.giver?.name,
        actorImage: k.giver?.image,
        receiverName: k.receiver?.name,
        receiverImage: k.receiver?.image,
      })),
      ...shoutoutsData.map((s: any) => ({
        id: `s-${s.id}`,
        type: "shoutout" as const,
        message: s.message || "",
        createdAt: s.createdAt,
        actorName: s.submittedBy?.name,
        actorImage: s.submittedBy?.image,
        shoutoutType: formatShoutoutType(s.type),
      })),
    ];

    combined.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return combined.slice(0, limit);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return [];
  }
}

function formatShoutoutType(type: ShoutoutType | string): string {
  if (!type) return "Shoutout";
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// --- Dashboard Component ---
export default function DashboardPage() {
  const renderCount = useRef(0); // Ref to track render count
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  // Log render count and session status on every render
  useEffect(() => {
    renderCount.current += 1;
   
  }); // No dependency array - runs on every render

  // const prevSession = useRef(session); // Uncomment with the comparison log above if needed

  const isUserQueryEnabled = status === "authenticated" && !!userId;
  const isActivityQueryEnabled = status === "authenticated";

  // --- Stabilize queryFn for activity using useCallback ---
  const fetchActivityCallback = useCallback(() => {
   return fetchRecentActivity(5);
  }, []); // Empty dependency array: function reference is stable

  // --- Query for current user data ---
  const {
    data: user,
    isLoading: isLoadingUser,
    isFetching: isFetchingUser, // Use isFetching to see background updates
    isError: isErrorUser,
  } = useQuery<UserProfileSubset>({
    queryKey: ["dashboardUser", userId ?? "anonymous"], // Stable key
    queryFn: fetchCurrentUserProfile, // Stable reference
    enabled: isUserQueryEnabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    // Keep react-query defaults for notifications
  });

  // --- Query for recent activity ---
  const {
    data: activity,
    isLoading: isLoadingActivity,
    isFetching: isFetchingActivity, // Use isFetching
    isError: isErrorActivity,
  } = useQuery<ActivityItem[]>({
    queryKey: ["dashboardActivity"], // Stable key
    queryFn: fetchActivityCallback, // Use the memoized callback
    enabled: isActivityQueryEnabled,
    staleTime: 1000 * 60, // 1 minute
    // Keep react-query defaults for notifications
  });

  
  const isLoading =
    status === "loading" || // Session is loading
    (isUserQueryEnabled && isLoadingUser) || // User query is enabled and initially loading
    (isActivityQueryEnabled && isLoadingActivity); // Activity query is enabled and initially loading

  // --- Render Logic ---

  if (status === "loading") {
    // console.log("DashboardPage: Rendering Loading Skeleton (Session Loading)");
    return (
      <div className="container mx-auto py-8 px-4 space-y-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full md:col-span-1" />
          <Skeleton className="h-32 w-full md:col-span-2" />
          <Skeleton className="h-64 w-full md:col-span-3" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    // console.log("DashboardPage: Rendering Unauthenticated Message");
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p>Please log in to view the dashboard.</p>
      </div>
    );
  }

  // console.log("DashboardPage: Rendering Authenticated Content");

  // --- Authenticated Content ---
  // (Keep the JSX structure for the authenticated view exactly as before)
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Welcome Header */}
      <div className="space-y-1">
        {isUserQueryEnabled && isLoadingUser ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.name || session?.user?.name || "User"}!
          </h1>
        )}
        <p className="text-muted-foreground">
          Here's what's happening in your community.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Points Widget */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Points</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isUserQueryEnabled && isLoadingUser ? (
              <Skeleton className="h-10 w-24 mt-1" />
            ) : isErrorUser ? (
              <span className="text-xs text-destructive">
                Error loading points
              </span>
            ) : (
              <div className="text-4xl font-bold">
                {user?.points?.toLocaleString() ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Keep contributing!
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions Widget */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {/* Ensure GiveKudosDialog is stable */}
            <GiveKudosDialog />
            <Button variant="outline" asChild>
              <Link href="/app/shoutouts">
                <PartyPopper className="mr-2 h-4 w-4" /> Post a Shoutout
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/app/innovation">
                <Lightbulb className="mr-2 h-4 w-4" /> Submit an Idea
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity Widget */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest kudos and shoutouts across the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show skeleton only on initial load */}
            {isActivityQueryEnabled && isLoadingActivity && (
              <>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={`skel-${i}`} className="h-12 w-full" />
                ))}
              </>
            )}

            {/* Show error if query failed */}
            {isActivityQueryEnabled &&
              isErrorActivity &&
              !isLoadingActivity && ( // Don't show error during initial load
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Could not load recent activity. Please try again later.
                  </AlertDescription>
                </Alert>
              )}

            {/* Show content when loaded and no error */}
            {isActivityQueryEnabled &&
              !isLoadingActivity &&
              !isErrorActivity && (
                <>
                  {activity?.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent activity yet. Be the first to post!
                    </p>
                  )}
                  {activity?.map((item) => (
                    // ... (Keep the mapping logic the same)
                    <div
                      key={item.id}
                      className="flex items-center gap-3 text-sm border-b pb-3 last:border-b-0"
                    >
                      {item.type === "kudos" ? (
                        <Award className="h-5 w-5 text-primary flex-shrink-0" />
                      ) : (
                        <PartyPopper className="h-5 w-5 text-pink-500 flex-shrink-0" />
                      )}
                      <div className="flex-grow overflow-hidden">
                        <p className="truncate">
                          <span className="font-medium">
                            {item.actorName || "Someone"}
                          </span>
                          {item.type === "kudos" && item.receiverName && (
                            <>
                              {" gave Kudos to "}
                              <span className="font-medium">
                                {item.receiverName}
                              </span>
                            </>
                          )}
                          {item.type === "shoutout" && (
                            <>
                              {" posted a "}
                              <span className="font-medium">
                                {item.shoutoutType || "Shoutout"}
                              </span>
                            </>
                          )}
                          {item.message ? `: "${item.message}"` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="ml-auto flex-shrink-0"
                      >
                        <Link
                          href={
                            item.type === "kudos"
                              ? "/app/kudos"
                              : "/app/shoutouts"
                          }
                        >
                          View <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

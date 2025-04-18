// app/app/page.tsx
"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
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
import Link from "next/link"; // For linking to other pages
import {
  Star,
  Award,
  ArrowRight,
  PartyPopper,
  Terminal,
  Lightbulb,
} from "lucide-react"; // Icons
import { GiveKudosDialog } from "@/components/kudos/GiveKudosDialog"; // Import the dialog
import { ShoutoutType } from "@prisma/client";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";

// --- Type Definitions (align with API responses) ---
type UserProfileSubset = {
  name: string | null;
  points: number;
};
type ActivityItem = {
  // Combined type for recent activity feed
  id: string;
  type: "kudos" | "shoutout"; // Differentiate item type
  message: string;
  createdAt: string;
  actorName: string | null; // Person who gave kudos or submitted shoutout
  actorImage: string | null;
  // Optional fields depending on type
  receiverName?: string | null;
  receiverImage?: string | null;
  shoutoutType?: string | null; // Formatted type
};

// --- API Fetch Functions ---
async function fetchCurrentUser(userId: string): Promise<UserProfileSubset> {
  // Modify to accept userId
  console.log("Fetching current user for dashboard (ID):", userId); // Log with ID
  // No need for API call if no ID, but enabled handles this
  const response = await fetch("/api/users/me"); // API uses session internally
  if (!response.ok) throw new Error("Failed to fetch user data");
  const data = await response.json();
  return { name: data.name, points: data.points };
}
async function fetchRecentActivity(limit: number = 5): Promise<ActivityItem[]> {
  // Fetch both kudos and shoutouts, sort by date, take limit
  // This can be optimized later with a dedicated backend endpoint
  console.log("Fetching recent activity for dashboard..."); // Add log
  const [kudosRes, shoutoutsRes] = await Promise.all([
    fetch(`/api/kudos?limit=${limit}`), // Assuming limit param exists or modify API
    fetch(`/api/shoutouts?limit=${limit}`), // Assuming limit param exists or modify API
  ]);

  if (!kudosRes.ok || !shoutoutsRes.ok) {
    console.error("Failed to fetch recent activity streams");
    // Return empty or throw partial error? For UI, empty might be better
    return [];
  }

  const kudosData = await kudosRes.json();
  const shoutoutsData = await shoutoutsRes.json();

  // Combine and format data
  const combined = [
    ...kudosData.map((k: any) => ({
      id: `k-${k.id}`,
      type: "kudos" as const,
      message: k.message,
      createdAt: k.createdAt,
      actorName: k.giver.name,
      actorImage: k.giver.image,
      receiverName: k.receiver.name,
      receiverImage: k.receiver.image,
    })),
    ...shoutoutsData.map((s: any) => ({
      id: `s-${s.id}`,
      type: "shoutout" as const,
      message: s.message,
      createdAt: s.createdAt,
      actorName: s.submittedBy.name,
      actorImage: s.submittedBy.image,
      shoutoutType: formatShoutoutType(s.type), // Use helper function
    })),
  ];

  // Sort combined array by date descending
  combined.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Take the actual limit
  return combined.slice(0, limit);
}

// Helper function for initials (same as in UserNav/KudosCard)
function getInitials(name?: string | null): string {
  if (!name) return "?";
  const names = name.split(" ");
  if (names.length === 1) return names[0].substring(0, 1).toUpperCase();
  return (
    names[0].substring(0, 1) + names[names.length - 1].substring(0, 1)
  ).toUpperCase();
}
// Helper to format enum keys to readable strings
function formatShoutoutType(type: ShoutoutType): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function DashboardPage() {
  // const { data: session, status } = useSession(); // Get status for clarity
  // const userId = session?.user?.id;
  const status = "authenticated"; // Mock status
  const userId = "cm9kzii010000vwq0hzrnggjf"; // Mock userId
  const mockSession = {
    user: { id: userId, name: "Mock User", email: "mock@test.com" },
  };
  console.log(
    "Dashboard Rendering - Session Status:",
    status,
    "UserID:",
    userId
  ); // Log user ID
  // Query for current user data
  const {
    data: user,
    isLoading: isLoadingUser,
    isError: isErrorUser,
    error: errorUser,
  } = useQuery<UserProfileSubset>({
    queryKey: ["dashboardUser", userId],
    queryFn: () => fetchCurrentUser(userId!),
    enabled:
      status === "authenticated" &&
      typeof userId === "string" &&
      userId.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Query for recent activity
  const {
    data: activity,
    isLoading: isLoadingActivity,
    isError: isErrorActivity,
    error: errorActivity,
  } = useQuery<ActivityItem[]>({
    queryKey: ["dashboardActivity"],
    queryFn: () => fetchRecentActivity(5), // Fetch latest 5 items
    enabled: status === "authenticated",
    staleTime: 1000 * 60, // 1 minute
  });

  const isLoading =
    status === "loading" ||
    (status === "authenticated" && (isLoadingUser || isLoadingActivity));

  console.log("Dashboard Rendering...", {
    isLoadingUser,
    isLoadingActivity,
    userId: userId,
  });
  if (status === "loading") {
    return (
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Show a loading indicator for the whole page */}
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full md:col-span-1" />
          <Skeleton className="h-32 w-full md:col-span-2" />
          <Skeleton className="h-64 w-full md:col-span-3" />
        </div>
      </div>
    );
  }
  // Handle unauthenticated state (middleware should prevent this, but good practice)
  if (status === "unauthenticated") {
    // Redirect logic or message. Middleware usually handles this.
    return (
      <div className="container mx-auto py-8 px-4">Redirecting to login...</div>
    );
  }
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* --- Welcome Header --- */}
      <div className="space-y-1">
        {isLoadingUser && !user ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <h1 className="text-3xl font-bold">
            Welcome back, {mockSession.user?.name || "User"}!
          </h1>
        )}
        <p className="text-muted-foreground">
          Here's what's happening in your community.
        </p>
      </div>
      {/* --- Grid Layout for Widgets --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* --- Points Widget --- */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Points</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoadingUser && !user ? (
              <Skeleton className="h-10 w-24 mt-1" />
            ) : isErrorUser ? (
              <span className="text-xs text-destructive">Error</span>
            ) : (
              <div className="text-4xl font-bold">
                {user?.points?.toLocaleString() ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Keep contributing to earn more!
            </p>
          </CardContent>
        </Card>

        {/* --- Quick Actions Widget --- */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <GiveKudosDialog /> {/* Reuse the existing dialog component */}
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
            {/* Add more actions */}
          </CardContent>
        </Card>

        {/* --- Recent Activity Widget --- */}
        <Card className="md:col-span-3">
          {" "}
          {/* Span full width */}
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest kudos and shoutouts across the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingActivity &&
              !activity &&
              [...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            {isErrorActivity && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Could not load recent activity.
                </AlertDescription>
              </Alert>
            )}
            {!isLoadingActivity &&
              !isErrorActivity &&
              activity?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity yet.
                </p>
              )}
            {!isLoadingActivity &&
              !isErrorActivity &&
              activity?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 text-sm border-b pb-3 last:border-b-0"
                >
                  {/* Icon based on type */}
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
                          {" "}
                          gave Kudos to{" "}
                          <span className="font-medium">
                            {item.receiverName}
                          </span>
                        </>
                      )}
                      {item.type === "shoutout" && (
                        <>
                          {" "}
                          posted a{" "}
                          <span className="font-medium">
                            {item.shoutoutType || "Shoutout"}
                          </span>
                        </>
                      )}
                      : "{item.message}"
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="ml-auto">
                    <Link
                      href={
                        item.type === "kudos" ? "/app/kudos" : "/app/shoutouts"
                      }
                    >
                      View <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>{" "}
      {/* End Grid */}
    </div> // End Container
  );
}

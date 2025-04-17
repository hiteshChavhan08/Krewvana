// app/app/profile/me/page.tsx
"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Star, Award, CalendarDays, Terminal } from "lucide-react"; // Icons
import { format } from "date-fns"; // Date formatting

// Import Magic UI components (adjust path if you placed them elsewhere)
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { cn } from "@/lib/utils"; // Ensure cn is available
import { Badge as ShadcnBadge } from "@/components/ui/badge"; // Renamed import to avoid conflict if needed// Import Badge component
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Import Tooltip
import { Send, HeartHandshake, Sparkles, HelpCircle } from "lucide-react"; // Import badge icons
// Import the type (adjust path)
// import { UserProfile } from '@/types';
// --- Ensure UserProfile type is defined correctly ---
type BadgeData = {
  // Define type for the nested badge data
  id: string;
  name: string;
  description: string;
  iconName: string | null;
};

type UserBadgeData = {
  // Define type for items in the userBadges array
  earnedAt: string;
  badge: BadgeData;
};

type UserProfile = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  points: number;
  createdAt: string;
  userBadges?: UserBadgeData[]; // Use the defined type here
};
// --- End Type Definitions ---
// Helper function for initials
function getInitials(name?: string | null): string {
  if (!name) return "?";
  const names = name.split(" ");
  if (names.length === 1) return names[0].substring(0, 1).toUpperCase();
  return (
    names[0].substring(0, 1) + names[names.length - 1].substring(0, 1)
  ).toUpperCase();
}

// --- API Fetch Function ---
async function fetchUserProfile(): Promise<any> {
  // Use UserProfile type later
  const response = await fetch("/api/users/me");
  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }
  return response.json();
}

// --- Icon Mapping Helper ---
const BadgeIcon = ({
  iconName,
  className,
}: {
  iconName: string | null;
  className?: string;
}) => {
  const sizeClass = className || "h-4 w-4"; // Default size
  switch (iconName) {
    case "Send":
      return <Send className={sizeClass} />;
    case "HeartHandshake":
      return <HeartHandshake className={sizeClass} />;
    case "Sparkles":
      return <Sparkles className={sizeClass} />;
    // Add more cases for future badge icons
    default:
      return <HelpCircle className={sizeClass} />; // Default icon
  }
};

export default function ProfilePage() {
  const { data: session } = useSession(); // Get session for query key if needed
  const userId = session?.user?.id;

  const {
    data: user,
    isLoading,
    error,
    isError,
  } = useQuery<any>({
    // Use UserProfile type later
    // Query key includes userId to refetch if user changes (though unlikely here)
    queryKey: ["userProfile", userId],
    queryFn: fetchUserProfile,
    enabled: !!userId, // Only run query if userId is available
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  if (isLoading || !userId) {
    // Elegant Skeleton Loader
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-32" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-lg">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Could not load your profile. Please try again later. (
            {error?.message})
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  if (!isLoading && !isError && !user) {
    return (
      <div className="container mx-auto py-8 px-4">User data not found.</div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">User data not found.</div>
    ); // Should ideally not happen if query enabled correctly
  }

  return (
    <div className="relative container mx-auto py-8 px-4 max-w-4xl overflow-hidden">
      {/* Magic UI Background */}
      <DotPattern
        width={30}
        height={30}
        cx={1}
        cy={1}
        cr={1}
        className={cn(
          "[mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)] ",
          "absolute inset-0 z-0" // Ensure it's behind content
        )}
      />

      {/* Profile Content (Ensure z-index higher than pattern) */}
      <div className="relative z-10 space-y-8">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Avatar className="h-24 w-24 border-2 border-primary">
            <AvatarImage
              src={user.image ?? undefined}
              alt={user.name ?? "User"}
            />
            <AvatarFallback className="text-3xl">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{user.name || "User"}</h1>
            <p className="text-muted-foreground">{user.email}</p>
            {user.createdAt && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center">
                <CalendarDays className="h-4 w-4 mr-1.5" />
                Member since {format(new Date(user.createdAt), "MMMM yyyy")}
              </p>
            )}
          </div>
        </div>

        {/* Grid for Points and Badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Points Card */}
          <Card className="overflow-hidden">
            {" "}
            {/* Add overflow hidden for shiny text */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Points
              </CardTitle>
              <Star className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {/* Magic UI Animated Shiny Text for Points */}
              <div
                className={cn(
                  "z-10 flex items-center justify-center" // Centering if needed
                  // Background can be added for more contrast if desired
                  // "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg"
                )}
              >
                <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
                  {/* Apply large text size directly */}
                  <span className="text-5xl font-bold tracking-tighter">
                    {user.points?.toLocaleString() ?? 0}
                  </span>
                </AnimatedShinyText>
              </div>
            </CardContent>
          </Card>

          {/* --- Badges Card (Updated) --- */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Earned Badges
              </CardTitle>
              <Award className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              {user?.userBadges && user.userBadges.length > 0 ? (
                <TooltipProvider delayDuration={100}>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {user.userBadges.map(( UserBadge: UserBadgeData ) => (
                      <Tooltip key={UserBadge.badge.id}>
                        <TooltipTrigger>
                          <ShadcnBadge
                            variant="secondary"
                            className="flex items-center gap-1.5 cursor-default px-2 py-1"
                          >
                            <BadgeIcon
                              iconName={UserBadge.badge.iconName}
                              className="h-3.5 w-3.5"
                            />
                            <span className="text-xs">{UserBadge.badge.name}</span>
                          </ShadcnBadge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-center">
                          <p className="font-semibold">{UserBadge.badge.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {UserBadge.badge.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Earned: {format(new Date(UserBadge.earnedAt), "PP")}
                          </p>{" "}
                          {/* Pretty date */}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              ) : (
                <p className="text-sm text-muted-foreground pt-2">
                  No badges earned yet. Keep contributing!
                </p>
              )}
            </CardContent>
          </Card>
          {/* --- End Badges Card --- */}
        </div>

        {/* Other sections can be added later (e.g., Activity Feed) */}
      </div>
    </div>
  );
}

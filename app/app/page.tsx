// app/app/page.tsx
"use client";

import React, { useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Star, Settings, ListChecks } from "lucide-react"; // Use appropriate icons

// Import API functions and types
import {
  fetchCurrentUserProfile,
  fetchRecentActivity,
} from "@/lib/api/dashboardApi"; // Adjust path
import { type UserProfileSubset, type ActivityItem } from "@/types/dashboard"; // Adjust path

// Import UI Components & Grid Components
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"; // Adjust path
import { PointsDisplay } from "@/components/profile/PointsDisplay"; // Use PointsDisplay from profile
import { QuickActionsContent } from "@/components/dashboard/QuickActionsContent"; // Use new QuickActions
import { RecentActivityContent } from "@/components/dashboard/RecentActivityContent"; // Use new Activity
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton"; // Use new Skeleton
import { BentoGrid } from "@/components/ui/bento-grid";
import { ProfileGridItem } from "@/components/profile/ProfileGridItem"; // Use the item wrapper

// --- Dashboard Component ---
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const isUserQueryEnabled = status === "authenticated" && !!userId;
  const isActivityQueryEnabled = status === "authenticated";

  // --- Queries (remain the same logic) ---
  const fetchActivityCallback = useCallback(() => fetchRecentActivity(5), []);
  const {
    data: user,
    isLoading: isLoadingUser,
    isError: isErrorUser,
  } = useQuery<UserProfileSubset>({
    queryKey: ["dashboardUser", userId ?? "guest"],
    queryFn: fetchCurrentUserProfile,
    enabled: isUserQueryEnabled,
    staleTime: 1000 * 60 * 5,
  });
  const {
    data: activity,
    isLoading: isLoadingActivity,
    isError: isErrorActivity,
  } = useQuery<ActivityItem[]>({
    queryKey: ["dashboardActivity"],
    queryFn: fetchActivityCallback,
    enabled: isActivityQueryEnabled,
    staleTime: 1000 * 60,
  });

  // --- Page Loading State ---
  if (status === "loading") {
    return <DashboardSkeleton />; // Use the updated skeleton
  }

  // --- Unauthenticated State ---
  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p>Please log in.</p>
      </div>
    );
  }

  // --- Authenticated Render ---
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header remains outside the grid */}
      <DashboardHeader
        userName={user?.name ?? session?.user?.name}
        isLoading={isUserQueryEnabled && isLoadingUser}
      />

      {/* Bento Grid for Widgets */}
      <BentoGrid className="max-w-4xl mx-auto auto-rows-auto md:auto-rows-[14rem] flex-grow pb-4">
        {/* {" "} */}
        {/* Adjust row height if needed */}
        {/* Points Item */}
        <ProfileGridItem
          key="points"
          icon={<Star className="h-4 w-4 text-black dark:text-neutral-400" />}
          title="My Points"
          // titleClassName="" // Use item title for label
          className="md:col-span-1"
        >
          {/* Use PointsDisplay as the main content */}
          <PointsDisplay
            points={user?.points ?? 0}
            className="h-full items-center justify-center" // Center vertically and horizontally
          />
        </ProfileGridItem>
        {/* Quick Actions Item */}
        <ProfileGridItem
          key="actions"
          icon={
            <Settings className="h-4 w-4 text-black dark:text-neutral-400" />
          }
          title="Quick Actions"
          // titleClassName="!text-sm !font-medium"
          className="md:col-span-2" // Span 2 columns
        >
          {/* QuickActionsContent renders directly */}
          <QuickActionsContent className="p-2 h-full items-center" />{" "}
          {/* Add padding/alignment */}
        </ProfileGridItem>
        {/* Recent Activity Item */}
        <ProfileGridItem
          key="activity"
          icon={
            <ListChecks className="h-4 w-4 text-black dark:text-neutral-400" />
          }
          title="Recent Activity"
          // titleClassName="!text-sm !font-medium"
          className="md:col-span-3" // Span full width
        >
          {/* RecentActivityContent renders directly */}
          <RecentActivityContent
            activity={activity}
            isLoading={isActivityQueryEnabled && isLoadingActivity}
            isError={isErrorActivity}
            isEnabled={isActivityQueryEnabled}
            className="p-2 max-h-[18rem] overflow-y-auto" // Limit height and allow scroll
          />
        </ProfileGridItem>
      </BentoGrid>
    </div>
  );
}

// components/dashboard/DashboardSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { BentoGrid } from "@/components/ui/bento-grid"; // Use correct Bento import
import { ProfileGridItem } from "@/components/profile/ProfileGridItem"; // Use Profile Grid Item wrapper

export const DashboardSkeleton = () => (
  <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8">
    {/* Header Skeleton */}
    <div className="flex items-center space-x-4 mb-8">
        <Skeleton className="h-8 w-64 rounded" />
    </div>
     <div className="text-muted-foreground">
        <Skeleton className="h-4 w-80 rounded" />
    </div>

    {/* Bento Grid Skeleton using ProfileGridItem */}
    <BentoGrid className="max-w-4xl mx-auto auto-rows-auto md:auto-rows-[12rem]"> {/* Adjust row height */}
      {/* Points Item Skeleton */}
      <ProfileGridItem key="points-sk" className="md:col-span-1">
         <div className="flex flex-col items-center justify-center h-full w-full">
           <Skeleton className="h-12 w-24" />
           <Skeleton className="h-4 w-20 mt-2" />
         </div>
      </ProfileGridItem>

      {/* Quick Actions Skeleton */}
      <ProfileGridItem key="actions-sk" className="md:col-span-2">
         <div className="flex flex-wrap gap-3 items-center h-full p-4">
            <Skeleton className="h-9 w-32 rounded-md"/>
            <Skeleton className="h-9 w-36 rounded-md"/>
            <Skeleton className="h-9 w-32 rounded-md"/>
         </div>
      </ProfileGridItem>

      {/* Activity Feed Skeleton */}
      <ProfileGridItem key="activity-sk" className="md:col-span-3">
         <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full rounded"/>
            <Skeleton className="h-10 w-full rounded"/>
            <Skeleton className="h-10 w-full rounded"/>
         </div>
      </ProfileGridItem>
    </BentoGrid>
  </div>
);
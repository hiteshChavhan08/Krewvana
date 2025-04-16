// app/collaboration/[id]/loading.tsx

import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container py-8 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>

      {/* Description Skeleton */}
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />

      {/* Tabs Skeleton */}
      <div className="flex space-x-4 mt-6">
        <Skeleton className="h-10 w-20 rounded-md" />
        <Skeleton className="h-10 w-20 rounded-md" />
        <Skeleton className="h-10 w-20 rounded-md" />
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4 mt-6">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="p-4 border rounded-md space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex space-x-4 mt-2">
              <Skeleton className="h-6 w-12 rounded-md" />
              <Skeleton className="h-6 w-12 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

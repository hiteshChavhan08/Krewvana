import { Skeleton } from "@/components/ui/skeleton";

export function SessionDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-3xl py-8 px-4 md:px-6 lg:px-8 space-y-8">
        {/* Header Skeleton */}
        <div className="bg-background/80 backdrop-blur-sm rounded-lg p-6 shadow-sm border border-border/50 space-y-4">
          <div>
            <Skeleton className="h-8 w-4/5 mb-3" />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="flex items-center mb-4">
              <Skeleton className="h-10 w-10 rounded-full mr-3" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
            <Skeleton className="h-4 w-44 mt-2" />
            <div className="mt-3 space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
            </div>
          </div>
          
          {/* Session Controls Skeleton */}
          <div className="mt-6 pt-4 border-t border-dashed">
            <Skeleton className="h-5 w-32 mb-3" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
        </div>

        {/* Question Submit Skeleton */}
        <div className="bg-background/80 backdrop-blur-sm rounded-lg p-6 shadow-sm border border-border/50">
          <div className="flex items-center mb-4">
            <Skeleton className="h-8 w-8 mr-2 rounded" />
            <Skeleton className="h-7 w-40" />
          </div>
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <Skeleton className="h-10 w-36" />
        </div>

        {/* Question List Skeleton */}
        <div className="bg-background/80 backdrop-blur-sm rounded-lg p-6 shadow-sm border border-border/50">
          <div className="flex items-center mb-6">
            <Skeleton className="h-8 w-8 mr-2 rounded" />
            <Skeleton className="h-7 w-40" />
          </div>
          
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-7 w-22" />
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
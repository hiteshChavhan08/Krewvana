import { Skeleton } from "@/components/ui/skeleton";
export const QuestionDetailSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-3/4" />
    <Skeleton className="h-4 w-1/4" />
    <Skeleton className="h-20 w-full" />
  </div>
);

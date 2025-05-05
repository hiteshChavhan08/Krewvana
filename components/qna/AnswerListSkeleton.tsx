import { Skeleton } from "@/components/ui/skeleton";
export const AnswerListSkeleton = () => (
  <div className="space-y-4 mt-8">
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-24 w-full" />
  </div>
);

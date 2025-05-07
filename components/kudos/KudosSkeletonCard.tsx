// components/kudos/KudosSkeletonCard.tsx
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

export const KudosSkeletonCard = () => {
  return (
    <div className="mb-6 md:mb-8">
      <Card className="overflow-hidden">
        <CardHeader className="p-4 pb-3">
          {/* ... (Header Skeleton remains the same) ... */}
        </CardHeader>
        <CardContent className="p-4 pt-2">
          {/* Skeleton for Categories */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          {/* Skeleton for Message */}
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-2 flex justify-between items-center">
          {/* ... (Footer Skeleton remains the same) ... */}
        </CardFooter>
      </Card>
    </div>
  );
};

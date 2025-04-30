// components/kudos/KudosSkeletonCard.tsx

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export const KudosSkeletonCard = () => {
  return (
    <Card className="overflow-hidden">
        <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-20" />
            </div>
        </CardHeader>
        <CardContent className="p-4 pt-1">
             <Skeleton className="h-4 w-full mb-1" />
             <Skeleton className="h-4 w-3/4" />
        </CardContent>
        <CardFooter className="p-3 flex justify-end">
            <Skeleton className="h-3 w-16" />
        </CardFooter>
    </Card>
  );
};
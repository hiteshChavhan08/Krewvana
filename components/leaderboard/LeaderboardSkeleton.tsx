// components/leaderboard/LeaderboardSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card"; // Keep Card for table wrapper skeleton
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const LeaderboardSkeleton = () => (
  <div className="container mx-auto py-8 px-4">
    <Skeleton className="h-9 w-64 mb-10 mx-auto" /> {/* Header Skeleton */}
    {/* Top 3 Podium Skeleton */}
    <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-0 md:space-x-[-20px] lg:space-x-[-30px] mb-12">
      {/* Rank 2 Skeleton */}
      <div className="w-full md:w-1/4 order-2 md:order-1">
        <Skeleton className="h-44 rounded-t-lg" />
      </div>
      {/* Rank 1 Skeleton - Elevated */}
      <div className="w-full md:w-1/3 order-1 md:order-2 z-10 transform -translate-y-4 md:-translate-y-6">
        <Skeleton className="h-48 rounded-t-lg" />
      </div>
      {/* Rank 3 Skeleton */}
      <div className="w-full md:w-1/4 order-3 md:order-3">
        <Skeleton className="h-44 rounded-t-lg" />
      </div>
    </div>
    {/* Table Header Skeleton */}
    <Skeleton className="h-6 w-48 mb-4" />
    {/* Table Skeleton */}
    <Card className="mt-0">
      {" "}
      {/* Remove margin for skeleton */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[70px]">
              <Skeleton className="h-5 w-10 mx-auto" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-5 w-24" />
            </TableHead>
            <TableHead className="text-right">
              <Skeleton className="h-5 w-16 ml-auto" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(7)].map(
            (
              _,
              i // Show more skeleton rows
            ) => (
              <TableRow key={`row-skel-${i}`}>
                <TableCell className="text-center align-middle">
                  <Skeleton className="h-5 w-5 mx-auto" />
                </TableCell>
                <TableCell className="align-middle">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
                <TableCell className="text-right align-middle">
                  <Skeleton className="h-5 w-12 ml-auto" />
                </TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
    </Card>
  </div>
);

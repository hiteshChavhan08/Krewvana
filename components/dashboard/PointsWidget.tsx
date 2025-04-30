// components/dashboard/PointsWidget.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

interface PointsWidgetProps {
  points: number | undefined;
  isLoading: boolean;
  isError: boolean;
}

export const PointsWidget: React.FC<PointsWidgetProps> = ({ points, isLoading, isError }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">My Points</CardTitle>
        <Star className="h-4 w-4 text-yellow-500" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-24 mt-1 rounded" />
        ) : isError ? (
          <span className="text-xs text-destructive">Error</span>
        ) : (
          <div className="text-4xl font-bold">
            {points?.toLocaleString() ?? 0}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Keep contributing!
        </p>
      </CardContent>
    </Card>
  );
};
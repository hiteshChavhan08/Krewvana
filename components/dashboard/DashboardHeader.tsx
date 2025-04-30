// components/dashboard/DashboardHeader.tsx
"use client";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardHeaderProps {
  userName: string | null | undefined;
  isLoading: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName, isLoading }) => {
  return (
    <div className="space-y-1">
      {isLoading ? (
        <Skeleton className="h-8 w-64 rounded" />
      ) : (
        <h1 className="text-3xl font-bold">
          Welcome back, {userName || "User"}!
        </h1>
      )}
      <p className="text-muted-foreground">
        Here's what's happening in your community.
      </p>
    </div>
  );
};
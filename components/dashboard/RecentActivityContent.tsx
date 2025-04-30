// components/dashboard/RecentActivityContent.tsx
"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { type ActivityItem } from "@/types/dashboard"; // Adjust path
import { ActivityItemDisplay } from "./ActivityItemDisplay"; // Adjust path
import { cn } from "@/lib/utils";

interface RecentActivityContentProps {
  activity: ActivityItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isEnabled: boolean;
  className?: string;
}

export const RecentActivityContent: React.FC<RecentActivityContentProps> = ({
  activity, isLoading, isError, isEnabled, className
}) => {
  // Removed Card wrappers

  const showLoading = isEnabled && isLoading;
  const showError = isEnabled && isError && !isLoading;
  const showContent = isEnabled && !isLoading && !isError;

  return (
    <div className={cn("space-y-4 h-full", className)}> {/* Ensure takes height */}
      {showLoading && (
        <>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={`skel-${i}`} className="h-12 w-full rounded" />
          ))}
        </>
      )}

      {showError && (
        <Alert variant="destructive" className="mt-4">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Could not load recent activity.</AlertDescription>
        </Alert>
      )}

      {showContent && (
        <>
          {activity?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activity yet. Be the first to post!
            </p>
          )}
          {/* Ensure list itself doesn't grow indefinitely if container has fixed height */}
          <div className="space-y-4 overflow-y-auto max-h-full">
              {activity?.map((item) => (
                <ActivityItemDisplay key={item.id} item={item} />
              ))}
          </div>
        </>
      )}

       {!isEnabled && !isLoading && (
          <p className="text-sm text-muted-foreground text-center py-4">
              Log in to see recent activity.
          </p>
       )}
    </div>
  );
};
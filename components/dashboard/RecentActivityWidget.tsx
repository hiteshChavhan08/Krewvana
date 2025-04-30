// components/dashboard/RecentActivityWidget.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { type ActivityItem } from "@/types/dashboard"; // Adjust path
import { ActivityItemDisplay } from "./ActivityItemDisplay"; // Import sub-component

interface RecentActivityWidgetProps {
  activity: ActivityItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isEnabled: boolean; // Pass query enabled status
}

export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  activity, isLoading, isError, isEnabled
}) => {
  const showLoading = isEnabled && isLoading;
  const showError = isEnabled && isError && !isLoading; // Show error only if enabled, finished loading, and has error
  const showContent = isEnabled && !isLoading && !isError;

  return (
    <Card className="md:col-span-3"> {/* Span full width */}
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest kudos and shoutouts across the platform.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showLoading && (
          <>
            {[...Array(3)].map((_, i) => ( // Show 3 skeletons
              <Skeleton key={`skel-${i}`} className="h-12 w-full rounded" />
            ))}
          </>
        )}

        {showError && (
          <Alert variant="destructive">
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
            {activity?.map((item) => (
              <ActivityItemDisplay key={item.id} item={item} />
            ))}
          </>
        )}
         {!isEnabled && !isLoading && ( // If query was disabled (e.g., logged out)
            <p className="text-sm text-muted-foreground text-center py-4">
                Log in to see recent activity.
            </p>
         )}
      </CardContent>
    </Card>
  );
};
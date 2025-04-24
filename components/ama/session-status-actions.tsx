"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button"; // Keep for AlertDialog Trigger
import {ShinyButton} from "@/components/magicui/shiny-button"; // Import ShineButton (adjust path)
import {BorderBeam} from "@/components/magicui/border-beam"; // Import BorderBeam (adjust path)
import { Play, Square, Ban, Loader2 } from "lucide-react";
import { AMASessionStatus } from "@prisma/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SessionStatusActionsProps {
  sessionId: string;
  currentStatus: AMASessionStatus;
}

export function SessionStatusActions({ sessionId, currentStatus }: SessionStatusActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<AMASessionStatus | false>(false);

  const handleUpdateStatus = async (newStatus: AMASessionStatus) => {
    setIsLoading(newStatus);
    const actionText = newStatus.toLowerCase();
    const toastId = toast.loading(`Updating status to ${actionText}...`);

    try {
      const response = await fetch(`/api/ama/sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `Failed to ${actionText} session`);
      }

      toast.success(`Session status updated to ${actionText}.`, { id: toastId });
      router.refresh();
    } catch (error: any) {
      console.error(`Failed to ${actionText} session:`, error);
      toast.error(`Error: ${error.message || `Could not ${actionText} session.`}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Wrap actions in a relative container for BorderBeam
    <div className="relative rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 mb-4">
       {/* Apply BorderBeam */}
       <BorderBeam size={100} duration={12} delay={9} />

       <div className="flex flex-wrap items-center gap-2">
        {/* --- Start Session Button --- */}
        {currentStatus === AMASessionStatus.UPCOMING && (
          <ShinyButton
            // size="sm"
            onClick={() => !isLoading && handleUpdateStatus(AMASessionStatus.LIVE)}
            // disabled={!!isLoading}
            className="shadow-lg" // Add Tailwind classes as needed
            // Custom colors if needed:
            // color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
            // background="bg-red-600 hover:bg-red-700" // Adjust background if default doesn't match
          >
            {isLoading === AMASessionStatus.LIVE ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Play className="h-4 w-4 mr-1.5" />
            )}
            Start Session Now
          </ShinyButton>
        )}

        {/* --- End Session Button --- */}
        {currentStatus === AMASessionStatus.LIVE && (
          <ShinyButton
            // size="sm"
            onClick={() => !isLoading && handleUpdateStatus(AMASessionStatus.ENDED)}
            // disabled={!!isLoading}
            className="shadow-lg" // Add Tailwind classes as needed
            // Ensure border styles work or override:
            // borderClassName="border border-neutral-300"
            // background="bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {isLoading === AMASessionStatus.ENDED ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Square className="h-4 w-4 mr-1.5" />
            )}
            End Session
          </ShinyButton>
        )}

        {/* --- Cancel Session Button (using standard Button for trigger) --- */}
        {(currentStatus === AMASessionStatus.UPCOMING || currentStatus === AMASessionStatus.LIVE) && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              {/* Use standard button; ShineButton might interfere with asChild */}
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={!!isLoading}
              >
                <Ban className="h-4 w-4 mr-1.5" /> Cancel Session
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Session?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently cancel the session. Are you sure?</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading === AMASessionStatus.CANCELLED}>Back</AlertDialogCancel>
                {/* You could potentially use ShineButton here too if desired */}
                <AlertDialogAction
                  onClick={() => handleUpdateStatus(AMASessionStatus.CANCELLED)}
                  disabled={isLoading === AMASessionStatus.CANCELLED}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isLoading === AMASessionStatus.CANCELLED ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  Yes, Cancel
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Display message if Ended/Cancelled */}
        {(currentStatus === AMASessionStatus.ENDED || currentStatus === AMASessionStatus.CANCELLED) && (
          <p className="text-sm text-muted-foreground italic pl-2">Session {currentStatus.toLowerCase()}.</p>
        )}
      </div>
    </div>
  );
}
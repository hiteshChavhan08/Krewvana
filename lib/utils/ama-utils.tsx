import { AMASessionStatus } from "@prisma/client";


// Get status badge properties
export function getStatusBadgeProps(status: AMASessionStatus): {
  label: string;
  variant:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning";
  animation?: boolean;
} {
  switch (status) {
    case AMASessionStatus.LIVE:
      return {
        label: "LIVE",
        variant: "success",
        animation: true,
      };
    case AMASessionStatus.UPCOMING:
      return {
        label: "Upcoming",
        variant: "secondary",
      };
    case AMASessionStatus.ENDED:
      return {
        label: "Ended",
        variant: "outline",
      };
    case AMASessionStatus.CANCELLED:
      return {
        label: "Cancelled",
        variant: "destructive",
      };
    default:
      return {
        label: status,
        variant: "outline",
      };
  }
}

// Format date for display
export function formatSessionDate(date: Date | string): string {
  const sessionDate = new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZoneName: "short",
  }).format(sessionDate);
}

/**
 * Determines if questions can be submitted based on session status.
 */
export function canSubmitQuestions(status: AMASessionStatus): boolean {
  // Allow submissions during UPCOMING and LIVE phases
  return (
    status === AMASessionStatus.UPCOMING || status === AMASessionStatus.LIVE
  );
}

/**
 * Determines if the session is currently active for answering/displaying live status.
 */
export function isSessionLive(status: AMASessionStatus): boolean {
  return status === AMASessionStatus.LIVE;
}

/**
 * Determines if the session has finished.
 */
export function isSessionEnded(status: AMASessionStatus): boolean {
  return (
    status === AMASessionStatus.ENDED || status === AMASessionStatus.CANCELLED
  );
}

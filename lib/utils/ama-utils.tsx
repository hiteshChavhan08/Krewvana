import { AMASessionStatus } from "@prisma/client";

// Helper function to determine if questions can be submitted
export function canSubmitQuestions(status: AMASessionStatus): boolean {
  return status === AMASessionStatus.UPCOMING || status === AMASessionStatus.LIVE;
}

// Get status badge properties
export function getStatusBadgeProps(status: AMASessionStatus): { 
  label: string; 
  variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  animation?: boolean;
} {
  switch (status) {
    case AMASessionStatus.LIVE:
      return { 
        label: "LIVE", 
        variant: "success", 
        animation: true 
      };
    case AMASessionStatus.UPCOMING:
      return { 
        label: "Upcoming", 
        variant: "secondary" 
      };
    case AMASessionStatus.ENDED:
      return { 
        label: "Ended", 
        variant: "outline" 
      };
    case AMASessionStatus.CANCELLED:
      return { 
        label: "Cancelled", 
        variant: "destructive" 
      };
    default:
      return { 
        label: status, 
        variant: "outline" 
      };
  }
}

// Format date for display
export function formatSessionDate(date: Date | string): string {
  const sessionDate = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short'
  }).format(sessionDate);
}
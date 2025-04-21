// lib/utils/helpers.ts
import { MentorshipCircleStatus, AMASessionStatus } from "@prisma/client"; // Import enums needed

// --- Type Definition for Standard Shadcn Badge Variants ---
type StandardBadgeVariant = "default" | "secondary" | "destructive" | "outline";

/**
 * Generates initials from a name string.
 * @param name - The full name string.
 * @returns A string containing the initials (e.g., "JD" for "John Doe", "A?" for "Admin").
 */
export const getInitials = (name?: string | null): string => {
  if (!name?.trim()) return "??"; // Return placeholder if name is empty or whitespace
  const names = name.trim().split(" ");
  // Handle single names (take first two letters)
  if (names.length === 1 && names[0].length > 1)
    return names[0].substring(0, 2).toUpperCase();
  if (names.length === 1 && names[0].length === 1)
    return names[0].toUpperCase() + "?"; // Handle single letter name
  // Handle multiple names (first letter of first and last)
  if (names.length > 1)
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  // Fallback (should ideally not be reached with trim)
  return "??";
};

// --- Mentorship Specific ---

/**
 * Determines the appropriate base Shadcn Badge variant for a MentorshipCircleStatus.
 * Styling specifics (colors, borders) should be applied via className in the component.
 * @param status - The MentorshipCircleStatus enum value.
 * @returns A standard BadgeVariant ("default", "secondary", "destructive", "outline").
 */
export const getMentorshipStatusBadgeVariant = (
  status: MentorshipCircleStatus
): StandardBadgeVariant => {
  switch (status) {
    case MentorshipCircleStatus.ACTIVE:
      return "default"; // Base variant for active
    case MentorshipCircleStatus.FORMING:
    case MentorshipCircleStatus.PROPOSED:
    case MentorshipCircleStatus.PENDING_APPROVAL:
      return "secondary"; // Base for forming/pending
    case MentorshipCircleStatus.COMPLETED:
      return "outline";
    case MentorshipCircleStatus.CANCELLED:
      return "destructive";
    default:
      return "secondary";
  }
};

// --- AMA Specific ---

/**
 * Determines the appropriate base Shadcn Badge variant for an AMASessionStatus.
 * Styling specifics (colors, borders) should be applied via className in the component.
 * @param status - The AMASessionStatus enum value.
 * @returns A standard BadgeVariant ("default", "secondary", "destructive", "outline").
 */
export const getAMAStatusBadgeVariant = (
  status: AMASessionStatus
): StandardBadgeVariant => {
  switch (status) {
    // Use 'destructive' often signifies urgency/live state
    case AMASessionStatus.LIVE:
      return "destructive";
    case AMASessionStatus.UPCOMING:
      return "secondary";
    case AMASessionStatus.ENDED:
      return "outline";
    // Use 'destructive' or 'outline' for cancelled
    case AMASessionStatus.CANCELLED:
      return "outline";
    default:
      return "secondary";
  }
};

/**
 * Converts an AMASessionStatus enum into a user-friendly display string.
 * @param status - The AMASessionStatus enum value.
 * @returns A capitalized string (e.g., "Upcoming", "Ended").
 */
export const getAMAStatusText = (status: AMASessionStatus): string => {
  // Handle potential null/undefined status if needed, though enum should prevent this
  if (!status) return "Unknown";
  // Simple capitalization
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

// NOTE: The getStatusIcon functions remain within their respective page components
// (/app/app/mentorship/circles/[circleId]/page.tsx) because they return JSX (Lucide icons),
// making them less purely "utility" functions and more tied to the specific UI rendering.
// If you used them in MANY places, you could abstract them, but for now, keeping them
// co-located with their usage is acceptable.

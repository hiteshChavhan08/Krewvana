// types/dashboard.ts (or types/user.ts, types/activity.ts)
import { ShoutoutType } from "@prisma/client"; // Assuming you have this

export type UserProfileSubset = {
  name: string | null;
  points: number;
};

export type ActivityItem = {
  id: string;
  type: "kudos" | "shoutout";
  message: string;
  createdAt: string; // Keep as string from API
  actorName: string | null;
  actorImage?: string | null;
  receiverName?: string | null;
  receiverImage?: string | null;
  shoutoutType?: string | null; // Formatted type name
};

// Utility function if needed elsewhere, or keep local/in API layer
export function formatShoutoutType(
  type: ShoutoutType | string | null | undefined
): string {
  if (!type) return "Shoutout";
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

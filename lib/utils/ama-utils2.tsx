// src/lib/utils/view-helpers.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNowStrict } from "date-fns";
import { AMASessionStatus } from "@prisma/client";


export function getInitials(name?: string | null): string {
  if (!name) return "?";
  const names = name.split(" ");
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (
    (names[0].charAt(0) || "") + (names[names.length - 1].charAt(0) || "")
  ).toUpperCase();
}

export function formatTimestamp(
  date: Date | string | null | undefined,
  type: "short" | "long" | "relative" = "relative"
): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  try {
    if (type === "short") {
      return format(dateObj, "MMM d, yyyy"); // e.g., Apr 25, 2025
    }
    if (type === "long") {
      return format(dateObj, "MMMM d, yyyy 'at' h:mm a"); // e.g., April 25, 2025 at 9:08 AM
    }
    // Default to relative
    return formatDistanceToNowStrict(dateObj, { addSuffix: true }); // e.g., 5 minutes ago
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
}

// Helper to get badge variant based on status
export function getStatusBadgeVariant(
  status: AMASessionStatus
): "default" | "destructive" | "secondary" | "outline" {
  switch (status) {
    case AMASessionStatus.LIVE:
      return "destructive"; // Red for live might be engaging
    case AMASessionStatus.UPCOMING:
      return "secondary";
    case AMASessionStatus.ENDED:
    case AMASessionStatus.CANCELLED:
      return "outline";
    default:
      return "default";
  }
}

// Helper to get user-friendly status text
export function getStatusText(status: AMASessionStatus): string {
  switch (status) {
    case AMASessionStatus.LIVE:
      return "Live Now";
    case AMASessionStatus.UPCOMING:
      return "Upcoming";
    case AMASessionStatus.ENDED:
      return "Ended";
    case AMASessionStatus.CANCELLED:
      return "Cancelled";
    default:
      return status; // Fallback
  }
}

// components/ama/ama-session-list.tsx
import { AMASessionStatus } from "@prisma/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mic } from "lucide-react";
import { AMASessionCard, AMASessionData } from "./ama-session-card"; // Import type and card
import { AMAListSkeleton } from "./ama-list-skeleton"; // Import skeleton

const getStatusText = (status: AMASessionStatus): string => {
  if (!status) return "";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

// Renamed from FetchAMAList to be more descriptive
export async function AMASessionList({ status }: { status: AMASessionStatus }) {
  try {
    const baseUrl = process.env.INTERNAL_APP_URL;
    if (!baseUrl) {
      console.error("INTERNAL_APP_URL environment variable is not set.");
      throw new Error("Application configuration error.");
    }

    // Consider adding pagination later if needed (using searchParams maybe)
    const apiUrl = `${baseUrl}/api/ama/sessions?status=${status}&limit=9`;
    console.log(`Fetching AMA sessions (${status}) from: ${apiUrl}`);

    // Use fetch with no-store cache for dynamic data
    const response = await fetch(apiUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.text(); // Get more error details
      console.error(
        `Failed to fetch AMA sessions (${status}): ${response.status} ${response.statusText}`,
        errorData
      );
      throw new Error(`Could not load ${status.toLowerCase()} sessions.`);
    }

    const result = await response.json();
    const sessions: AMASessionData[] = result.data || [];

    if (sessions.length === 0) {
      return (
        <Alert className="mt-4">
          <Mic className="h-4 w-4" />
          <AlertTitle>No {getStatusText(status)} Sessions</AlertTitle>
          <AlertDescription>
            There are currently no {status.toLowerCase()} AMA sessions. Check
            back later!
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {sessions.map((session) => (
          <AMASessionCard key={session.id} session={session} />
        ))}
      </div>
    );
  } catch (error) {
    console.error(
      `Unexpected error fetching/rendering AMA sessions (${status}):`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertTitle>Error Loading Sessions</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    );
  }
}
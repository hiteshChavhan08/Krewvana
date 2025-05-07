// app/app/leaderboard/page.tsx
"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Trophy } from "lucide-react";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { cn } from "@/lib/utils";

// Import the TYPE ONLY from the types file
import { type LeaderboardUser } from "@/types/leaderboard"; // Adjust path

// Import Sub-components (remain the same)
import { TopThreePodium } from "@/components/leaderboard/TopThreePodium";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { LeaderboardSkeleton } from "@/components/leaderboard/LeaderboardSkeleton";
import { WarpBackground } from "@/components/magicui/warp-background";
import { RetroGrid } from "@/components/magicui/retro-grid";

// --- NEW: API Fetch Function for the Client ---
async function fetchLeaderboardDataFromApi(
  limit: number
): Promise<LeaderboardUser[]> {
  const response = await fetch(`/api/leaderboard?limit=${limit}`); // Fetch from the API route
  if (!response.ok) {
    let errorMsg = "Failed to fetch leaderboard data";
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch (e) {
      /* Ignore if response not JSON */
    }
    throw new Error(errorMsg);
  }
  // The API route now directly returns the array
  return response.json();
}

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const currentUserId = session?.user?.id;
  const leaderboardLimit = 25;

  const {
    data: leaderboard,
    isLoading, // This isLoading now reflects the API call status
    error,
    isError,
  } = useQuery<LeaderboardUser[]>({
    queryKey: ["leaderboard", leaderboardLimit],
    // 👇 Use the NEW fetch function that calls the API route
    queryFn: () => fetchLeaderboardDataFromApi(leaderboardLimit),
    staleTime: 1000 * 60 * 5, // Reduced stale time slightly maybe
    enabled: status === "authenticated", // Only enable when authenticated
  });

  // Separate top 3 from the rest (remains the same)
  const topThree = leaderboard?.slice(0, 3) ?? [];
  const restOfLeaderboard = leaderboard?.slice(3) ?? [];

  // --- Render Logic ---

  // Use session status for initial skeleton
  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return <LeaderboardSkeleton />;
  }

  // Handle unauthenticated state
  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <Alert variant="default" className="max-w-md mx-auto">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to view the leaderboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Handle API error state
  if (isError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Loading Leaderboard</AlertTitle>
          <AlertDescription>
            Could not load data. Please try refreshing. ({error?.message})
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // --- Main Content Render (remains the same structure) ---
  return (
    // <WarpBackground className="container mx-auto">
    <div className="container mx-auto">
      <RetroGrid></RetroGrid>
      <div className="relative z-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-30 text-center">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <span className="">Leaderboard</span>
        </h1>

        {topThree.length >= 1 && <TopThreePodium users={topThree} />}
        {/* Simplified handling for <3 users */}
        {topThree.length > 0 && topThree.length < 3 && (
          <div className="flex justify-center gap-4 mb-10">
            {/* Render simplified cards or adapt podium */}
          </div>
        )}

        {leaderboard && leaderboard.length === 0 && (
          <p className="text-center text-muted-foreground py-16 text-lg">
            The leaderboard is empty!
          </p>
        )}

        {restOfLeaderboard.length > 0 && (
          <div className="pb-6 px-8 bg-transparent">
            <h2 className="text-xl font-semibold mb-4 mt-8">
              Rankings #{topThree.length + 1} - #{leaderboard?.length}
            </h2>
            <LeaderboardTable
              users={restOfLeaderboard}
              highlightUserId={currentUserId}
            />
          </div>
        )}
      </div>
    </div>
  );
}

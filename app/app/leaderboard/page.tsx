// app/app/leaderboard/page.tsx
"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Trophy } from "lucide-react"; // Icons
import { getInitials } from "@/lib/utils/helpers";

// Define the expected shape of a leaderboard user
type LeaderboardUser = {
  id: string;
  name: string | null;
  image: string | null;
  points: number;
  rank: number;
};

// --- API Fetch Function ---
async function fetchLeaderboard(
  limit: number = 25
): Promise<LeaderboardUser[]> {
  const response = await fetch(`/api/leaderboard?limit=${limit}`);
  if (!response.ok) {
    throw new Error("Failed to fetch leaderboard data");
  }
  return response.json();
}

export default function LeaderboardPage() {
  const leaderboardLimit = 25; // How many users to show

  const {
    data: leaderboard,
    isLoading,
    error,
    isError,
  } = useQuery<LeaderboardUser[]>({
    queryKey: ["leaderboard", leaderboardLimit], // Include limit in query key
    queryFn: () => fetchLeaderboard(leaderboardLimit),
    // Optional: Add staleTime etc.
    // staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center flex items-center justify-center gap-2">
        <Trophy className="h-8 w-8 text-yellow-500" /> Leaderboard
      </h1>

      {isError && (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Loading Leaderboard</AlertTitle>
          <AlertDescription>
            Could not load leaderboard data. Please try again later. (
            {error?.message})
          </AlertDescription>
        </Alert>
      )}

      {/* Table Display */}
      <div className="border rounded-lg max-w-4xl mx-auto overflow-hidden">
        <Table>
          {/* Optional Caption */}
          {/* <TableCaption>Top {leaderboardLimit} contributors.</TableCaption> */}
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-center">Rank</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              // Skeleton Loading Rows
              [...Array(5)].map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  <TableCell className="text-center">
                    <Skeleton className="h-5 w-5 rounded-full mx-auto" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading &&
              !isError &&
              leaderboard &&
              leaderboard.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground h-24"
                  >
                    No points awarded yet!
                  </TableCell>
                </TableRow>
              )}

            {!isLoading &&
              !isError &&
              leaderboard?.map((user) => (
                <TableRow key={user.id}>
                  {/* Rank Cell: Use Flexbox for better alignment */}
                  <TableCell className="font-medium align-middle">
                    {" "}
                    {/* Add align-middle */}
                    <div className="flex items-center justify-center gap-x-1.5">
                      {" "}
                      {/* Centered flex container */}
                      {user.rank === 1 && (
                        <Trophy className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                      )}{" "}
                      {/* Removed margins/inline */}
                      {user.rank === 2 && (
                        <Trophy className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                      {user.rank === 3 && (
                        <Trophy className="h-5 w-5 text-orange-400 flex-shrink-0" />
                      )}
                      {/* Ensure rank number has consistent styling */}
                      <span className="text-lg">{user.rank}</span>
                    </div>
                  </TableCell>
                  {/* User Cell: Ensure vertical alignment */}
                  <TableCell className="align-middle">
                    {" "}
                    {/* Add align-middle */}
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={user.image ?? undefined}
                          alt={user.name ?? "User"}
                        />
                        <AvatarFallback>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium truncate">
                        {user.name || "Anonymous User"}
                      </span>
                    </div>
                  </TableCell>
                  {/* Points Cell: Ensure vertical alignment */}
                  <TableCell className="text-right font-semibold align-middle">
                    {user.points}
                  </TableCell>{" "}
                  {/* Add align-middle */}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

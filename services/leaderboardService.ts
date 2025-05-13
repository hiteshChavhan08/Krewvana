// services/leaderboardService.ts

import { prisma } from "@/lib/prisma";
import {
  ApiError,
  BadRequestError, // Import custom errors if needed for validation
} from "@/lib/api/responses";
import { LeaderboardUser } from "@/types/leaderboard";

// Define or import AuthenticatedUser type (may not be needed if endpoint is public/auth check is simple)
// interface AuthenticatedUser { id: string; role?: UserRole | null; }
interface LeaderboardParams {
  limit?: number;
  // period?: 'all_time' | 'monthly' | 'weekly'; // Future enhancement
}

/**
 * Fetches the user leaderboard based on points and adds rank.
 * @param params - Parameters like limit.
 * @returns An array of ranked users.
 * @throws BadRequestError for invalid limit.
 */
export const getLeaderboard = async (
  params: LeaderboardParams
): Promise<LeaderboardUser[]> => {
  const { limit = 25 } = params; // Default limit

  if (isNaN(limit) || limit <= 0 || limit > 200) {
    throw new BadRequestError(
      "Invalid limit parameter. Must be between 1 and 200."
    );
  }

  // TODO: Implement time period filtering later

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      points: true,
    },
    orderBy: {
      points: "desc",
    },
    // Fetch slightly more initially if filtering out zero points later
    take: limit,
    // Optional: Filter out users with 0 points if desired
    // where: { points: { gt: 0 } },
  });

  // Add rank to the results
  const rankedLeaderboard: LeaderboardUser[] = users
    // .filter(user => user.points > 0) // Optional: filter zero points *before* ranking
    .map((user, index) => ({
      ...user,
      rank: index + 1, // Add 1-based rank
    }));
  // .slice(0, limit); // Slice again if filtering zero points changed the count

  return rankedLeaderboard;
};

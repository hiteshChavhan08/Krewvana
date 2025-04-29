// services/leaderboardService.ts

import { prisma } from "@/lib/prisma";
import {
  ApiError,
  BadRequestError, // Import custom errors if needed for validation
} from "@/lib/api/responses";

// Define or import AuthenticatedUser type (may not be needed if endpoint is public/auth check is simple)
// interface AuthenticatedUser { id: string; role?: UserRole | null; }

interface LeaderboardParams {
  limit?: number;
  // period?: 'all_time' | 'monthly' | 'weekly'; // Future enhancement
}

/**
 * Fetches the user leaderboard based on points.
 * @param params - Parameters like limit.
 * @returns An array of ranked users.
 */
export const getLeaderboard = async (params: LeaderboardParams) => {
  const { limit = 25 } = params; // Default limit

  // Basic validation (could be done in handler too)
  if (isNaN(limit) || limit <= 0 || limit > 200) {
    // Add a max limit check
    throw new BadRequestError(
      "Invalid limit parameter. Must be between 1 and 200."
    );
  }

  // TODO: Implement time period filtering later based on 'period' param
  // This would likely involve filtering PointLog entries within a date range
  // and aggregating points, rather than just reading the user.points field.

  // Fetch users ordered by points
  const users = await prisma.user.findMany({
    select: {
      // Select only necessary fields
      id: true,
      name: true,
      image: true,
      points: true,
    },
    orderBy: {
      points: "desc",
    },
    take: limit,
    // Optional: Filter out users with 0 points if desired
    // where: { points: { gt: 0 } },
  });

  // Add rank to the results
  const rankedLeaderboard = users.map((user, index) => ({
    ...user,
    rank: index + 1, // Add 1-based rank
  }));

  return rankedLeaderboard;
};

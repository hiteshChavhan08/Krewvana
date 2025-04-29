// app/api/leaderboard/route.ts
import { NextResponse } from "next/server"; // Keep for 405 handler
import { getCurrentUser } from "@/lib/auth"; // Use our utility
import {
  respondSuccess,
  respondError,
  respondBadRequest,
  respondUnauthorized,
  ApiError,
  BadRequestError, // Import utilities & errors
} from "@/lib/api/responses";
import { getLeaderboard } from "@/services/leaderboardService"; // Import the service function

export async function GET(request: Request) {
  try {
    // 1. Authentication (ensure user is logged in to view leaderboard)
    const user = await getCurrentUser();
    if (!user?.id) {
      return respondUnauthorized();
    }

    // 2. Parse and Validate Query Params
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    let limit: number | undefined = undefined;

    if (limitParam !== null) {
      limit = parseInt(limitParam, 10);
      // Basic validation handled by service, but can double-check here if desired
      if (isNaN(limit)) {
        throw new BadRequestError(
          "Invalid 'limit' parameter: must be a number."
        );
      }
    }
    // Add parsing for 'period' later

    // 3. Call Service Function
    // Pass validated params (service applies defaults/further validation)
    const leaderboardData = await getLeaderboard({ limit });

    // 4. Success Response
    return respondSuccess(leaderboardData);
  } catch (error: any) {
    // 5. Centralized Error Handling
    if (error instanceof ApiError) {
      if (error instanceof BadRequestError)
        return respondBadRequest(error.message);
      // Handle other specific ApiErrors if getLeaderboard could throw them
    }
    console.error("[API GET /api/leaderboard] Error:", error);
    return respondError("Failed to fetch leaderboard.");
  }
}

// Add explicit handlers for other methods to return 405 Method Not Allowed
export async function POST() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
export async function PUT() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
export async function DELETE() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
export async function PATCH() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}

// app/api/users/route.ts
import { NextResponse } from "next/server"; // Keep for 405 handlers
import { getCurrentUser } from "@/lib/auth";
import {
  respondSuccess,
  respondError,
  respondBadRequest,
  respondUnauthorized,
  respondForbidden,
  ApiError,
  BadRequestError,
  ForbiddenError, // Import utilities & errors
} from "@/lib/api/responses";
import { listUsers } from "@/services/userService"; // Import the service function

// GET Handler - List users (e.g., for host selection)
export async function GET(req: Request) {
  try {
    // 1. Authentication (decide if required - service function can handle null)
    const user = await getCurrentUser();
    // Optional: Simple auth check if needed right away
    // if (!user) return respondUnauthorized();

    // 2. Parse and Validate Query Params
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const pageParam = searchParams.get("page");
    const searchTerm = searchParams.get("search");
    const excludeId = searchParams.get("excludeId");

    // Validate pagination
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 50; // Default limit from service
    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > 200) {
      // Max limit?
      throw new BadRequestError("Invalid pagination parameters (page/limit).");
    }

    // 3. Call Service Function
    const result = await listUsers(
      {
        page,
        limit,
        searchTerm,
        excludeId,
      },
      user // Pass current user for potential authorization checks in service
    );

    // 4. Success Response
    // Decide response format: paginated object or just the data array?
    // Service returns { data: [], pagination: {} }, so return the whole object
    return respondSuccess(result);
    // Or if the caller only expects the array: return respondSuccess(result.data);
  } catch (error: any) {
    // 5. Centralized Error Handling
    if (error instanceof ApiError) {
      if (error instanceof BadRequestError)
        return respondBadRequest(error.message);
      if (error instanceof ForbiddenError)
        return respondForbidden(error.message); // If service enforces auth
      if (error.status === 401) return respondUnauthorized(error.message); // If service enforces auth
    }
    console.error("[API GET /api/users] Error:", error);
    return respondError("Failed to fetch users.");
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

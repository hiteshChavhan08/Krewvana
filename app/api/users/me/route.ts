// app/api/users/me/route.ts
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth"; // Use our utility
import {
  respondSuccess,
  respondError,
  respondBadRequest,
  respondUnauthorized,
  respondNotFound,
  ApiError,
  BadRequestError,
  NotFoundError, // Import utilities & errors
} from "@/lib/api/responses";
import {
  getUserProfile,
  updateUserProfile,
  UserProfileUpdateSchema, // Import services and schema
} from "@/services/userService";
import { NextResponse } from "next/server";

// GET Handler - Fetch current user's profile
export async function GET(request: Request) {
  try {
    // 1. Authentication
    const user = await getCurrentUser();
    if (!user?.id) {
      return respondUnauthorized();
    }

    // 2. Call Service Function (handles fetching and not found)
    const userProfile = await getUserProfile(user.id);

    // 3. Success Response
    return respondSuccess(userProfile);
  } catch (error: any) {
    // 4. Centralized Error Handling
    if (error instanceof ApiError) {
      if (error instanceof NotFoundError) return respondNotFound(error.message);
      if (error.status === 401) return respondUnauthorized(error.message); // Just in case
    }
    console.error("[API GET /api/users/me] Error:", error);
    return respondError("Failed to fetch user profile.");
  }
}

// PUT Handler - Update current user's profile
export async function PUT(request: Request) {
  try {
    // 1. Authentication
    const user = await getCurrentUser();
    if (!user?.id) {
      return respondUnauthorized();
    }

    // 2. Request Body Parsing and Validation
    let validatedData: z.infer<typeof UserProfileUpdateSchema>;
    try {
      const body = await request.json();
      const validation = UserProfileUpdateSchema.safeParse(body);
      if (!validation.success) {
        throw new BadRequestError(
          "Invalid request body.",
          validation.error.flatten().fieldErrors as any
        );
      }
      validatedData = validation.data;
    } catch (e) {
      if (e instanceof SyntaxError)
        throw new BadRequestError("Invalid JSON format.");
      if (e instanceof BadRequestError) throw e; // Re-throw Zod validation error
      throw e; // Re-throw other parsing errors
    }

    // 3. Business Logic (handled by service)
    const updatedUserSubset = await updateUserProfile(user.id, validatedData);

    // 4. Success Response
    return respondSuccess(updatedUserSubset);
  } catch (error: any) {
    // 5. Centralized Error Handling
    if (error instanceof ApiError) {
      if (error instanceof BadRequestError)
        return respondBadRequest(error.message, error.errors);
      if (error.status === 401) return respondUnauthorized(error.message); // Should be caught earlier
      // Add other specific error checks if needed
    }
    console.error("[API PUT /api/users/me] Error:", error);
    return respondError("Failed to update profile.");
  }
}

// Add explicit handlers for other methods if needed
export async function POST() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
export async function DELETE() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
export async function PATCH() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}

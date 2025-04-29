// app/api/ama/sessions/[sessionId]/route.ts
import { z } from "zod";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  respondSuccess,
  respondError,
  respondBadRequest,
  respondUnauthorized,
  respondForbidden,
  respondNotFound,
  ApiError,
  BadRequestError,
  ForbiddenError,
  NotFoundError, // Import necessary utilities & errors
} from "@/lib/api/responses";
import {
  getAmaSessionById,
  updateAmaSessionStatus,
  updateSessionStatusSchema, // Import services and schema
} from "@/services/amaService";

// GET Handler - Fetch a single session
export async function GET(
  req: Request, // Keep req for potential future use (e.g., headers)
  { params }: { params: { sessionId?: string } }
) {
  try {
    // 1. Parameter Validation
    const { sessionId } = params;
    if (!sessionId) {
      throw new BadRequestError("Session ID parameter is required.");
    }

    // 2. Call Service Function (handles fetching and not found)
    const session = await getAmaSessionById(sessionId);

    // 3. Success Response
    return respondSuccess(session);
  } catch (error: any) {
    // 4. Centralized Error Handling
    if (error instanceof ApiError) {
      if (error instanceof BadRequestError)
        return respondBadRequest(error.message);
      if (error instanceof NotFoundError) return respondNotFound(error.message);
    }
    console.error(
      `[API GET /api/ama/sessions/${params.sessionId}] Error:`,
      error
    );
    return respondError("Failed to fetch AMA session.");
  }
}

// PUT Handler - Update Session Status
export async function PUT(
  req: Request,
  { params }: { params: { sessionId?: string } }
) {
  try {
    // 1. Authentication
    const user = await getCurrentUser();
    // Ensure user has necessary fields for authorization service
    if (!user?.id || user.role === undefined) {
      return respondUnauthorized("Authentication required with valid role.");
    }

    // 2. Parameter Validation
    const { sessionId } = params;
    if (!sessionId) {
      throw new BadRequestError("Session ID parameter is required.");
    }

    // 3. Request Body Parsing and Validation
    let validatedBody: z.infer<typeof updateSessionStatusSchema>;
    try {
      const body = await req.json();
      const validation = updateSessionStatusSchema.safeParse(body);
      if (!validation.success) {
        throw new BadRequestError(
          "Invalid request body.",
          validation.error.flatten().fieldErrors as any
        );
      }
      validatedBody = validation.data;
    } catch (e) {
      if (e instanceof SyntaxError)
        throw new BadRequestError("Invalid JSON format.");
      if (e instanceof BadRequestError) throw e; // Re-throw Zod validation error
      throw e; // Re-throw other parsing errors
    }

    // 4. Authorization & Business Logic (handled by service)
    const updatedSession = await updateAmaSessionStatus(
      sessionId,
      validatedBody.status,
      user
    );

    // 5. Success Response
    return respondSuccess(updatedSession);
  } catch (error: any) {
    // 6. Centralized Error Handling
    if (error instanceof ApiError) {
      if (error instanceof BadRequestError)
        return respondBadRequest(error.message, error.errors);
      if (error instanceof ForbiddenError)
        return respondForbidden(error.message);
      if (error instanceof NotFoundError) return respondNotFound(error.message); // Session not found during auth/update
    }
    console.error(
      `[API PUT /api/ama/sessions/${params.sessionId}] Error:`,
      error
    );
    return respondError("Failed to update session status.");
  }
}

// Add explicit handlers for other methods to return 405 Method Not Allowed
export async function POST() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
export async function DELETE() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
export async function PATCH() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}

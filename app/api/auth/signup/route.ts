// app/api/auth/signup/route.ts
import { NextResponse } from "next/server"; // Keep for 405 handler
import { z } from "zod"; // Keep for instanceof check
import { UserSignupSchema } from "@/lib/schemas"; // Import shared schema
import {
  respondSuccess,
  respondError,
  respondBadRequest,
  respondConflict, // Add respondConflict
  ApiError,
  BadRequestError,
  ConflictError, // Import errors
} from "@/lib/api/responses";
import { signupUser } from "@/services/authService"; // Import the service function

export async function POST(req: Request) {
  try {
    // 1. Request Body Parsing and Validation
    let validatedBody: z.infer<typeof UserSignupSchema>;
    try {
      const body = await req.json();
      // Use safeParse for better error handling within the handler
      const validation = UserSignupSchema.safeParse(body);
      if (!validation.success) {
        // Use flatten to get a map of field errors
        throw new BadRequestError(
          "Validation failed",
          validation.error.flatten().fieldErrors as any
        );
      }
      validatedBody = validation.data; // Contains validated and transformed (lowercase email) data
    } catch (e) {
      if (e instanceof SyntaxError)
        throw new BadRequestError("Invalid JSON format.");
      if (e instanceof BadRequestError) throw e; // Re-throw our validation error
      // Catch potential ZodErrors from direct .parse() if not using safeParse initially
      if (e instanceof z.ZodError) {
        throw new BadRequestError(
          "Validation failed.",
          e.flatten().fieldErrors as any
        );
      }
      throw e; // Re-throw other parsing errors
    }

    // 2. Business Logic (handled by service)
    const newUser = await signupUser(validatedBody);

    // 3. Success Response
    return respondSuccess(newUser, 201); // 201 Created
  } catch (error: any) {
    // 4. Centralized Error Handling
    if (error instanceof ApiError) {
      if (error instanceof BadRequestError)
        return respondBadRequest(error.message, error.errors);
      if (error instanceof ConflictError) return respondConflict(error.message); // Handle 409
      // Add other specific ApiError checks if needed
    }
    console.error("[API POST /api/auth/signup] Error:", error);
    // Use generic error response utility
    return respondError("An unexpected error occurred during signup.");
  }
}

// Add explicit handlers for other methods to return 405 Method Not Allowed
export async function GET() {
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

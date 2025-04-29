// app/api/ama/questions/[questionId]/answer/route.ts

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  respondSuccess,
  respondError,
  respondBadRequest,
  respondUnauthorized,
  respondForbidden,
  respondNotFound,
  ApiError,
  BadRequestError, // Import response utilities and custom errors
} from "@/lib/api/responses";
import { answerAmaQuestion } from "@/services/amaService"; // Import the new service function
import { NextResponse } from "next/server";

// Define the expected request body schema using Zod
const answerBodySchema = z
  .object({
    answerText: z
      .string()
      .trim()
      .min(1, "Answer text cannot be empty.")
      .max(5000),
  })
  .strict(); // Use strict to avoid unexpected fields

// PATCH Handler Function - Add/Update an answer
export async function PATCH(
  request: Request,
  { params }: { params: { questionId?: string } } // Make questionId optional for param check
) {
  try {
    // 1. Authentication
    const user = await getCurrentUser(); // Ensure user includes id and role
    if (!user || user.role === undefined) {
      // Also check role existence for service function
      return respondUnauthorized("Authentication required with valid role.");
    }

    // 2. Parameter Validation
    const { questionId } = params;
    if (!questionId) {
      throw new BadRequestError("Question ID parameter is required.");
    }

    // 3. Request Body Parsing and Validation
    let validatedBody: z.infer<typeof answerBodySchema>;
    try {
      const body = await request.json();
      const validation = answerBodySchema.safeParse(body);
      if (!validation.success) {
        throw new BadRequestError(
          "Invalid request body.",
          validation.error.errors
        );
      }
      validatedBody = validation.data;
    } catch (e) {
      if (e instanceof SyntaxError)
        throw new BadRequestError("Invalid JSON format.");
      throw e; // Re-throw other parsing/validation errors
    }

    // 4. Authorization & Business Logic (handled by service)
    // Pass validated answer text and the authenticated user (moderator)
    const updatedQuestion = await answerAmaQuestion(
      questionId,
      validatedBody.answerText,
      user // Pass the whole user object as AuthenticatedUser
    );

    // 5. Success Response
    // The service function returns the correctly structured and potentially anonymized data
    return respondSuccess(updatedQuestion);
  } catch (error: any) {
    // 6. Centralized Error Handling
    if (error instanceof ApiError) {
      // Handle specific custom API errors thrown by the service or validation
      if (error instanceof BadRequestError)
        return respondBadRequest(error.message, error.errors);
      if (error.status === 401) return respondUnauthorized(error.message); // Should be caught earlier
      if (error.status === 403) return respondForbidden(error.message);
      if (error.status === 404) return respondNotFound(error.message); // For question not found
    }
    if (error.code === "P2025") {
      // Handle Prisma RecordNotFound explicitly if service missed it
      return respondNotFound("AMA Question");
    }
    // Log unexpected errors
    console.error(
      `[API PATCH /api/ama/questions/${params.questionId}/answer] Error:`,
      error
    );
    return respondError("Failed to submit answer."); // Generic fallback
  }
}

// Add explicit handlers for other methods to return 405 Method Not Allowed
export async function GET() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
export async function POST() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
export async function PUT() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
export async function DELETE() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}

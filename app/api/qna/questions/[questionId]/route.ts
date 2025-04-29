// app/api/questions/[questionId]/route.ts
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
  NotFoundError, // Import utilities & errors
} from "@/lib/api/responses";
import {
  getQuestionDetails,
  updateQuestion,
  deleteQuestion,
  UpdateQuestionInputSchema, // Import services and schema
} from "@/services/qnaService";

// GET Handler - Fetch Single Question Details
export async function GET(
  request: Request,
  { params }: { params: { questionId?: string } }
) {
  try {
    // 1. Authentication (optional, service fn needs userId for vote status)
    const user = await getCurrentUser();

    // 2. Parameter Validation
    const { questionId } = params;
    if (!questionId) {
      throw new BadRequestError("Question ID parameter is required.");
    }

    // 3. Call Service Function (handles fetching, vote processing, not found)
    const questionDetails = await getQuestionDetails(questionId, user?.id); // Pass userId or null

    // 4. Success Response
    return respondSuccess(questionDetails);
  } catch (error: any) {
    // 5. Centralized Error Handling
    if (error instanceof ApiError) {
      if (error instanceof BadRequestError)
        return respondBadRequest(error.message);
      if (error instanceof NotFoundError) return respondNotFound(error.message);
    }
    console.error(
      `[API GET /api/questions/${params.questionId}] Error:`,
      error
    );
    return respondError("Failed to fetch question details.");
  }
}

// PUT Handler - Update Question
export async function PUT(
  request: Request,
  { params }: { params: { questionId?: string } }
) {
  try {
    // 1. Authentication
    const user = await getCurrentUser();
    if (!user?.id || user.role === undefined) {
      // Need full user for auth check
      return respondUnauthorized("Authentication required with valid role.");
    }

    // 2. Parameter Validation
    const { questionId } = params;
    if (!questionId) {
      throw new BadRequestError("Question ID parameter is required.");
    }

    // 3. Request Body Parsing and Validation
    let validatedData: z.infer<typeof UpdateQuestionInputSchema>;
    try {
      const body = await request.json();
      const validation = UpdateQuestionInputSchema.safeParse(body);
      if (!validation.success) {
        throw new BadRequestError(
          "Invalid request body.",
          validation.error.flatten().fieldErrors as any
        );
      }
      validatedData = validation.data;
      // Ensure at least one field is being updated
      if (Object.keys(validatedData).length === 0) {
        throw new BadRequestError("No fields provided for update.");
      }
    } catch (e) {
      if (e instanceof SyntaxError)
        throw new BadRequestError("Invalid JSON format.");
      if (e instanceof BadRequestError) throw e; // Re-throw Zod/validation error
      throw e; // Re-throw other parsing errors
    }

    // --- Placeholder for service call ---
    // 4. Authorization & Business Logic (handled by service)
    const updatedQuestion = await updateQuestion(
      questionId,
      validatedData,
      user
    );
    return respondSuccess(updatedQuestion);
    // return respondError("Update not yet implemented.", 501); // Use this until implemented
    // --- End Placeholder ---
  } catch (error: any) {
    // 5. Centralized Error Handling
    if (error instanceof ApiError) {
      if (error instanceof BadRequestError)
        return respondBadRequest(error.message, error.errors);
      if (error instanceof ForbiddenError)
        return respondForbidden(error.message);
      if (error instanceof NotFoundError) return respondNotFound(error.message);
    }
    if (error.message === "Update functionality not yet implemented.") {
      // Specific check for placeholder
      return respondError(error.message, 501);
    }
    console.error(
      `[API PUT /api/questions/${params.questionId}] Error:`,
      error
    );
    return respondError("Failed to update question.");
  }
}

// DELETE Handler - Delete Question
export async function DELETE(
  request: Request,
  { params }: { params: { questionId?: string } }
) {
  try {
    // 1. Authentication
    const user = await getCurrentUser();
    if (!user?.id || user.role === undefined) {
      // Need full user for auth check
      return respondUnauthorized("Authentication required with valid role.");
    }

    // 2. Parameter Validation
    const { questionId } = params;
    if (!questionId) {
      throw new BadRequestError("Question ID parameter is required.");
    }

    // --- Placeholder for service call ---
    // 3. Authorization & Business Logic (handled by service)
    await deleteQuestion(questionId, user);
    return respondSuccess({ message: "Question deleted successfully." }); // Or respondNoContent() if preferred
    // return respondError("Delete not yet implemented.", 501); // Use this until implemented
    // --- End Placeholder ---
  } catch (error: any) {
    // 4. Centralized Error Handling
    if (error instanceof ApiError) {
      if (error instanceof BadRequestError)
        return respondBadRequest(error.message);
      if (error instanceof ForbiddenError)
        return respondForbidden(error.message);
      if (error instanceof NotFoundError) return respondNotFound(error.message);
    }
    if (error.message === "Delete functionality not yet implemented.") {
      // Specific check for placeholder
      return respondError(error.message, 501);
    }
    console.error(
      `[API DELETE /api/questions/${params.questionId}] Error:`,
      error
    );
    return respondError("Failed to delete question.");
  }
}

// Add explicit handlers for other methods if needed
export async function POST() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
export async function PATCH() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}

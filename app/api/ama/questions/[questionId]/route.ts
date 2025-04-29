// app/api/ama/questions/[questionId]/route.ts
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth"; // Your session utility
import {
  respondSuccess,
  respondNoContent,
  respondError,
  respondBadRequest,
  respondUnauthorized,
  respondForbidden,
  respondNotFound,
  ApiError,
  BadRequestError, // Import response utilities and custom errors
} from "@/lib/api/responses";
import {
  updateAmaQuestion,
  deleteAmaQuestion, // Import service functions
} from "@/services/amaService";

// Schema for validating the request body for updates
const updateQuestionBodySchema = z
  .object({
    isApproved: z.boolean().optional(),
    answerText: z.string().min(0).max(5000).optional(), // Allow empty string for clearing
  })
  .strict(); // Use strict to prevent unknown fields

// PUT Handler - Update (Approve/Answer) a question
export async function PUT(
  req: Request,
  { params }: { params: { questionId?: string } } // Make questionId optional for param check
) {
  try {
    // 1. Authentication
    const user = await getCurrentUser(); // Assume this returns user with id and role
    if (!user) return respondUnauthorized();

    // 2. Parameter Validation
    const { questionId } = params;
    if (!questionId) {
      throw new BadRequestError("Question ID parameter is required.");
    }

    // 3. Request Body Parsing and Validation
    let validatedBody: z.infer<typeof updateQuestionBodySchema>;
    try {
      const body = await req.json();
      const validation = updateQuestionBodySchema.safeParse(body);
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
      throw e; // Re-throw other parsing errors or the BadRequestError from validation
    }

    // 4. Authorization & Business Logic (handled by service)
    const updatedQuestion = await updateAmaQuestion(
      questionId,
      validatedBody,
      user
    );

    // 5. Success Response
    return respondSuccess(updatedQuestion);
  } catch (error: any) {
    // 6. Centralized Error Handling
    if (error instanceof ApiError) {
      // Handle specific custom API errors
      if (error instanceof BadRequestError)
        return respondBadRequest(error.message, error.errors);
      if (error.status === 401) return respondUnauthorized(error.message);
      if (error.status === 403) return respondForbidden(error.message);
      if (error.status === 404) return respondNotFound(error.message);
    }
    if (error.code === "P2025") {
      // Example: Prisma RecordNotFound
      return respondNotFound("AMA Question");
    }
    // Log unexpected errors
    console.error(
      `[API PUT /api/ama/questions/${params.questionId}] Error:`,
      error
    );
    return respondError("Failed to update question."); // Generic fallback
  }
}

// DELETE Handler - Delete a Question
export async function DELETE(
  req: Request, // Keep req for signature consistency if needed
  { params }: { params: { questionId?: string } }
) {
  try {
    // 1. Authentication
    const user = await getCurrentUser();
    if (!user) return respondUnauthorized();

    // 2. Parameter Validation
    const { questionId } = params;
    if (!questionId) {
      throw new BadRequestError("Question ID parameter is required.");
    }

    // 3. Authorization & Business Logic (handled by service)
    await deleteAmaQuestion(questionId, user);

    // 4. Success Response
    return respondNoContent();
  } catch (error: any) {
    // 5. Centralized Error Handling (similar to PUT)
    if (error instanceof ApiError) {
      if (error.status === 401) return respondUnauthorized(error.message);
      if (error.status === 403) return respondForbidden(error.message);
      if (error.status === 404) return respondNotFound(error.message);
    }
    if (error.code === "P2025") {
      // Example: Prisma RecordNotFound
      return respondNotFound("AMA Question");
    }
    console.error(
      `[API DELETE /api/ama/questions/${params.questionId}] Error:`,
      error
    );
    return respondError("Failed to delete question.");
  }
}

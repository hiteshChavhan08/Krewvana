// app/api/questions/[questionId]/answers/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth"; // For author ID
import { prisma } from "@/lib/prisma"; // Import prisma directly if not using service yet
import {
  respondSuccess,
  respondError,
  respondBadRequest,
  respondUnauthorized,
  respondNotFound,
  ApiError,
  BadRequestError,
  NotFoundError,
} from "@/lib/api/responses"; // Your response helpers
import { CreateAnswerSchema } from "@/lib/validations/qna"; // Import validation schema
import { createAnswerForQuestion } from "@/services/qnaService";

// Type for route parameters
interface RouteParams {
  params: { questionId: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    // 1. Authentication: Ensure user is logged in
    const user = await getCurrentUser();
    if (!user?.id) {
      return respondUnauthorized("You must be logged in to post an answer.");
    }

    // 2. Get questionId from URL parameter
    const { questionId } = params;
    if (!questionId) {
      throw new BadRequestError("Question ID is missing from the URL.");
    }

    // 3. Validate Request Body ({ content: Value })
    let validatedBody: z.infer<typeof CreateAnswerSchema>;
    try {
      const body = await request.json();
      // Use the same Zod schema as the frontend form
      const validation = CreateAnswerSchema.safeParse(body);
      if (!validation.success) {
        throw new BadRequestError(
          "Invalid answer data.",
          validation.error.flatten().fieldErrors as any
        );
      }
      validatedBody = validation.data;
    } catch (e) {
      if (e instanceof SyntaxError)
        throw new BadRequestError("Invalid JSON format.");
      if (e instanceof BadRequestError) throw e;
      throw new Error("Failed to parse request body.");
    }

    // 4. Verify Question Exists (optional but good practice)
    const questionExists = await prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true },
    });
    if (!questionExists) {
      throw new NotFoundError("Question");
    }

    // --- 5. Create Answer in Database ---
    // (Ideally, move this logic into a service function: `createAnswerForQuestion`)
    // / --- Call Service Function ---
    const newAnswer = await createAnswerForQuestion(
      questionId,
      validatedBody.content, // Pass validated content
      user.id // Pass author ID
    );
    // --- End Database Creation ---

    // TODO: Award points? Send notifications? (Handle in service function ideally)

    // 6. Success Response
    return respondSuccess(newAnswer, 201); // Return the created answer data
  } catch (error: any) {
    // Handle specific errors first
    if (error instanceof BadRequestError)
      return respondBadRequest(error.message, error.errors);
    if (error instanceof NotFoundError) return respondNotFound(error.message);
    if (error instanceof ApiError)
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );

    // Generic error
    console.error(
      `[API POST /api/questions/${params.questionId}/answers] Error:`,
      error
    );
    return respondError("Failed to post answer.");
  }
}

// Optional: Add GET handler if you need to list answers for a question separately
// export async function GET(request: Request, { params }: RouteParams) { ... }

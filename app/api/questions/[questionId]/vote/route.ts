// app/api/questions/[questionId]/vote/route.ts
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { VoteType } from "@prisma/client";
import { voteQuestion } from "@/services/qnaService"; // Adjust path
import {
  respondSuccess,
  respondError,
  respondUnauthorized,
  respondBadRequest,
  respondNotFound,
  ApiError,
  BadRequestError,
  NotFoundError,
} from "@/lib/api/responses";

interface RouteParams {
  params: { questionId: string };
}

// Basic schema for vote type (can expand later if needed)
const VoteSchema = z
  .object({
    voteType: z.nativeEnum(VoteType),
  })
  .strict();

export async function POST(request: Request, { params }: RouteParams) {
  try {
    // 1. Authentication
    const user = await getCurrentUser();
    if (!user?.id) return respondUnauthorized();

    // 2. Get Question ID
    console.log("[Vote API] Route handler started. Params object:", params);
    const { questionId } = await params;
    if (!questionId) {
      console.error("[Vote API] questionId is missing from params:");
      throw new BadRequestError("Question ID missing.");
    }
    console.log("[Vote API] Extracted questionId:", questionId);
    // 3. Validate Body
    let validatedBody: z.infer<typeof VoteSchema>;
    try {
      const body = await request.json();
      validatedBody = VoteSchema.parse(body);
    } catch (e) {
      if (e instanceof ZodError)
        throw new BadRequestError(
          "Invalid vote type.",
          e.flatten().fieldErrors as any
        );
      if (e instanceof SyntaxError)
        throw new BadRequestError("Invalid JSON format.");
      throw e;
    }

    // 4. Call Service
    const result = await voteQuestion(questionId, {
      userId: user.id,
      voteType: validatedBody.voteType,
    });

    // 5. Respond
    return respondSuccess(result); // Return new count and user status
  } catch (error: any) {
    if (error instanceof BadRequestError)
      return respondBadRequest(error.message, error.errors);
    if (error instanceof NotFoundError) return respondNotFound(error.message);
    if (error instanceof ApiError)
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    console.error(
      `[API POST /api/questions/${params.questionId}/vote] Error:`,
      error
    );
    return respondError("Failed to process vote.");
  }
}

// Add 405 handlers for other methods
export async function GET() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
// ... etc

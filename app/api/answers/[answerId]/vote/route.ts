// app/api/answers/[answerId]/vote/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { VoteType } from "@prisma/client";
import { voteAnswer } from "@/services/qnaService"; // Adjust path
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
  params: { answerId: string };
}

// Basic schema for vote type
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

    // 2. Get Answer ID
    const { answerId } = params;
    if (!answerId) throw new BadRequestError("Answer ID missing.");

    // 3. Validate Body
    let validatedBody: z.infer<typeof VoteSchema>;
    try {
      const body = await request.json();
      validatedBody = VoteSchema.parse(body);
    } catch (e) {
      /* ... Zod/JSON error handling ... */ throw e;
    }

    // 4. Call Service
    const result = await voteAnswer(answerId, {
      userId: user.id,
      voteType: validatedBody.voteType,
    });

    // 5. Respond
    return respondSuccess(result);
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
      `[API POST /api/answers/${params.answerId}/vote] Error:`,
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

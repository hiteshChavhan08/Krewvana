// app/api/ama/questions/[questionId]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AMASessionStatus, UserRole } from "@prisma/client";

// Schema for updating a question (approval or answer)
const updateQuestionSchema = z.object({
  isApproved: z.boolean().optional(),
  answerText: z.string().min(1).max(5000).optional(), // Optional answer text
});

// Helper function to check if user is host or admin (implement actual admin check later)
async function canModerateQuestion(
  userId: string,
  questionId: string
): Promise<boolean> {
  try {
    const [question, currentUser] = await Promise.all([
      prisma.aMAQuestion.findUnique({
        where: { id: questionId },
        select: { session: { select: { hostId: true } } }, // Get hostId via session relation
      }),
      prisma.user.findUnique({
        // Get current user's role
        where: { id: userId },
        select: { role: true },
      }),
    ]);

    if (!question?.session?.hostId || !currentUser) return false;

    const isHost = question.session.hostId === userId;
    const isAdmin = currentUser.role === UserRole.ADMIN;

    return isHost || isAdmin; // Allow if Host OR Admin
  } catch (error) {
    console.log("Error checking moderation permissions:", error);
    return false;
  }
}

// PUT Handler - Approve a question or Add/Update an Answer
export async function PUT(
  req: Request,
  { params }: { params: { questionId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { questionId } = params;
    if (!questionId) {
      return NextResponse.json(
        { message: "Question ID required" },
        { status: 400 }
      );
    }

    // Authorization check: Only Host or Admin can update
    const canModerate = await canModerateQuestion(user.id, questionId);
    if (!canModerate) {
      return new NextResponse("Forbidden: You cannot moderate this question", {
        status: 403,
      });
    }

    const body = await req.json();
    const validation = updateQuestionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.errors },
        { status: 400 }
      );
    }

    const { isApproved, answerText } = validation.data;

    // Construct update data carefully
    let updateData: any = {};
    if (isApproved !== undefined) {
      updateData.isApproved = isApproved;
    }
    if (answerText !== undefined) {
      // If setting answer text, also set answeredBy and answeredAt
      updateData.answerText = answerText.trim() || null; // Allow empty string to clear answer? Or trim?
      updateData.answeredById = answerText.trim() ? user.id : null;
      updateData.answeredAt = answerText.trim() ? new Date() : null;
      // Typically, answering implies approval (adjust if needed)
      if (answerText.trim() && isApproved === undefined) {
        updateData.isApproved = true;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No update fields provided (isApproved or answerText)" },
        { status: 400 }
      );
    }

    const updatedQuestion = await prisma.aMAQuestion.update({
      where: { id: questionId },
      data: updateData,
      include: {
        // Include data needed for UI update
        submittedBy: { select: { id: true, name: true, image: true } },
        answeredBy: { select: { id: true, name: true, image: true } },
      },
    });

    // Anonymize submitter if needed before sending back
    const responseData = {
      ...updatedQuestion,
      submittedBy: updatedQuestion.isAnonymous
        ? null
        : updatedQuestion.submittedBy,
      submittedById: updatedQuestion.isAnonymous
        ? null
        : updatedQuestion.submittedById,
    };

    // TODO: Notify submitter if their question was answered/approved?

    return NextResponse.json(responseData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }
    console.error(`Error updating question ${params.questionId}:`, error);
    // Handle potential Prisma errors (e.g., record not found)
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE Handler - Delete a Question
export async function DELETE(
  req: Request, // Not used but required by signature
  { params }: { params: { questionId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { questionId } = params;
    if (!questionId) {
      return NextResponse.json(
        { message: "Question ID required" },
        { status: 400 }
      );
    }

    // Authorization check: Only Host or Admin can delete
    const canModerate = await canModerateQuestion(user.id, questionId);
    if (!canModerate) {
      return new NextResponse("Forbidden: You cannot delete this question", {
        status: 403,
      });
    }

    // Perform deletion
    await prisma.aMAQuestion.delete({
      where: { id: questionId },
    });

    // TODO: Notify submitter if their question was deleted? (Maybe not necessary)

    return new NextResponse(null, { status: 204 }); // No Content on success
  } catch (error) {
    console.error(`Error deleting question ${params.questionId}:`, error);
    // Handle potential Prisma errors (e.g., record not found)
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

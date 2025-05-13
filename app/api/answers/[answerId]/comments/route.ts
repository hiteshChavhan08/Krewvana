// app/api/answers/[answerId]/comments/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma"; // Adjust path as needed
import { getCurrentUser } from "@/lib/auth"; // Adjust path and function name as needed

// Schema for validating POST request body
const postCommentSchema = z.object({
  content: z
    .string()
    .min(1, { message: "Comment cannot be empty." })
    .max(2000, { message: "Comment is too long." }), // Adjust max length
});

// --- GET Handler: Fetch comments for an answer ---
export async function GET(
  request: Request, // Not used directly, but part of the signature
  { params }: { params: { answerId: string } }
) {
  const { answerId } = await params;

  if (!answerId) {
    return NextResponse.json(
      { error: "Answer ID is required" },
      { status: 400 }
    );
  }

  try {
    const comments = await prisma.comment.findMany({
      where: {
        answerId: answerId,
      },
      include: {
        // Include author details needed for display
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc", // Show oldest comments first
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error(`Error fetching comments for answer ${answerId}:`, error);
    // Check if it's a Prisma error indicating the answer doesn't exist?
    // (This might be better handled by checking answer existence before fetching)
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// --- POST Handler: Create a new comment on an answer ---
export async function POST(
  request: Request,
  { params }: { params: { answerId: string } }
) {
  const { answerId } = params;

  // 1. Check Authentication
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in." },
      { status: 401 }
    );
  }

  // 2. Validate Answer ID
  if (!answerId) {
    return NextResponse.json(
      { error: "Answer ID is required" },
      { status: 400 }
    );
  }

  // 3. Parse and Validate Request Body
  let validatedData;
  try {
    const body = await request.json();
    validatedData = postCommentSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  try {
    // 4. Verify the Answer exists (optional but good practice)
    const answerExists = await prisma.answer.findUnique({
      where: { id: answerId },
      select: { id: true, authorId: true, questionId: true }, // Select authorId for notification
    });
    if (!answerExists) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }

    // 5. Create the Comment
    const newComment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        answerId: answerId,
        authorId: user.id,
      },
      include: {
        // Include author details in the response
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // 6. (Optional) Create Notification for Answer Author
    // Avoid notifying user if they comment on their own answer
    if (answerExists.authorId !== user.id) {
      try {
        await prisma.notification.create({
          data: {
            userId: answerExists.authorId, // Notify the answer author
            type: "COMMENT_ON_ANSWER",
            message: `${user.name || "Someone"} commented on your answer.`,
            url: `/app/qna/${answerExists.questionId}#comment-${newComment.id}`, // Example URL structure
            commentId: newComment.id, // Link notification to the comment
            answerId: answerId, // Link to the answer
          },
        });
      } catch (notificationError) {
        console.error(
          `Failed to create notification for comment ${newComment.id}:`,
          notificationError
        );
        // Non-critical, don't fail the whole request
      }
    }

    // 7. (Optional) Award points if applicable
    // await prisma.pointLog.create({ ... });

    return NextResponse.json(newComment, { status: 201 }); // 201 Created
  } catch (error) {
    console.error(`Error creating comment for answer ${answerId}:`, error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

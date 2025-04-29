// app/api/questions/[questionId]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// --- GET Handler (Fetch Single Question Details) ---
export async function GET(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  const questionId = params.questionId;
  if (!questionId) {
    return new NextResponse(JSON.stringify({ message: 'Question ID is required' }), { status: 400 });
  }

  // Optional: Get current user session to determine vote status later
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  try {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        author: { select: { id: true, name: true, image: true } },
        tags: { include: { tag: { select: { name: true, id: true } } } },
        // Fetch all answers associated with this question
        answers: {
          orderBy: [
            // Show accepted answer first, then sort by votes (desc), then by creation date (asc)
            { isAccepted: 'desc' },
            // { votes: { _count: 'desc' } }, // Sorting by votes requires calculation/denormalization
            { createdAt: 'asc' },
          ],
          include: {
            author: { select: { id: true, name: true, image: true } },
            // Fetch votes for each answer (needed for count and user status)
            votes: {
              select: {
                userId: true,
                voteType: true, // Include vote type if needed later
              },
            },
          },
        },
        // Fetch votes for the question itself
        votes: {
            select: {
                userId: true,
                voteType: true,
            }
        },
        acceptedAnswer: { select: { id: true } }, // Still useful to confirm which one is accepted
      },
    });

    if (!question) {
      return new NextResponse(JSON.stringify({ message: 'Question not found' }), { status: 404 });
    }

    // --- Process Votes (Calculate counts and user status) ---
    // Process question votes
    const questionVoteCount = question.votes.length; // Simple count for now (assuming only upvotes)
    const userQuestionVote = userId ? question.votes.find(v => v.userId === userId) : null;

    // Process answer votes
    const answersWithVoteCounts = question.answers.map(answer => {
        const answerVoteCount = answer.votes.length;
        const userAnswerVote = userId ? answer.votes.find(v => v.userId === userId) : null;
        // Remove the raw votes array before sending to client for privacy/size
        const { votes, ...answerData } = answer;
        return {
            ...answerData,
            voteCount: answerVoteCount,
            userVote: userAnswerVote ? userAnswerVote.voteType : null, // Send 'UPVOTE' or null
        };
    });

    // Prepare final response object
    const { votes, answers, ...questionData } = question; // Remove raw votes/answers
    const responseData = {
        ...questionData,
        voteCount: questionVoteCount,
        userVote: userQuestionVote ? userQuestionVote.voteType : null,
        answers: answersWithVoteCounts, // Use processed answers
    };


    return NextResponse.json(responseData);

  } catch (error) {
    console.error(`[GET /api/questions/${questionId}] Failed to fetch question:`, error);
    return new NextResponse(JSON.stringify({ message: 'Failed to fetch question details' }), { status: 500 });
  }
}


// --- PUT Handler (Update Question - Placeholder) ---
export async function PUT(
    request: Request,
    { params }: { params: { questionId: string } }
) {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const questionId = params.questionId;

     if (!userId) {
        return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    }
     if (!questionId) {
        return new NextResponse(JSON.stringify({ message: 'Question ID is required' }), { status: 400 });
    }

    // TODO: Implement Zod validation for update payload (title, content, tags)
    // TODO: Fetch the question to check if the current user is the author OR an admin
    // TODO: Implement the actual update logic using prisma.question.update()
    // TODO: Handle tag updates (removing old, adding new)

    console.log("PUT request received for question:", questionId, "by user:", userId);
    const body = await request.json();
    console.log("Request body:", body);

    // Placeholder response
    return new NextResponse(JSON.stringify({ message: 'Update not yet implemented' }), { status: 501 });
}


// --- DELETE Handler (Delete Question - Placeholder) ---
export async function DELETE(
    request: Request,
    { params }: { params: { questionId: string } }
) {
     const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const questionId = params.questionId;

     if (!userId) {
        return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    }
     if (!questionId) {
        return new NextResponse(JSON.stringify({ message: 'Question ID is required' }), { status: 400 });
    }

    // TODO: Fetch the question to check if the current user is the author OR an admin
    // TODO: Implement the actual delete logic using prisma.question.delete() - Prisma schema handles cascades

    console.log("DELETE request received for question:", questionId, "by user:", userId);

    // Placeholder response
    return new NextResponse(JSON.stringify({ message: 'Delete not yet implemented' }), { status: 501 });
}
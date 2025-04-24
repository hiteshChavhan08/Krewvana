// app/api/ama/questions/[questionId]/answer/route.ts

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma'; // Adjust path if needed
import { getCurrentUser } from '@/lib/auth'; // Adjust path if needed
import { UserRole } from '@prisma/client';
import type { AMAQuestionData } from '@/types/types'; // Import shared type

// Define the expected request body schema using Zod
const answerSchema = z.object({
  answerText: z.string().trim().min(1, { message: "Answer text cannot be empty." }).max(5000, { message: "Answer cannot exceed 5000 characters." }), // Add reasonable max length
});

// PATCH Handler Function
export async function PATCH(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  try {
    // 1. Authentication & Authorization Check
    const currentUser = await getCurrentUser(); // Get session info
    if (!currentUser) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const { questionId } = await params;
    if (!questionId) {
        return NextResponse.json({ message: 'Question ID is required' }, { status: 400 });
    }

    // 2. Validate Request Body
    let validatedData;
    try {
        const body = await request.json();
        validatedData = answerSchema.parse(body);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid request body', errors: error.errors }, { status: 400 });
        }
        // Handle cases where body isn't valid JSON
        return NextResponse.json({ message: 'Invalid request body format' }, { status: 400 });
    }

    // 3. Fetch the Question and Session Host ID
    const question = await prisma.aMAQuestion.findUnique({
      where: { id: questionId },
      select: { // Select only needed fields for authorization
        id: true,
        sessionId: true,
        session: {
          select: {
            hostId: true,
          }
        }
      }
    });

    if (!question) {
      return NextResponse.json({ message: 'Question not found' }, { status: 404 });
    }

    // 4. Check if the User is Authorized (Host or Admin)
    const isHost = currentUser.id === question.session.hostId;
    const isAdmin = currentUser.role === UserRole.ADMIN;

    if (!isHost && !isAdmin) {
      return NextResponse.json({ message: 'User not authorized to answer this question' }, { status: 403 });
    }

    // 5. Update the Question in the Database
    const updatedQuestion = await prisma.aMAQuestion.update({
      where: { id: questionId },
      data: {
        answerText: validatedData.answerText,
        answeredAt: new Date(),
        answeredById: currentUser.id, // Link the answer to the current user
      },
      // Include relations needed by the frontend card component
      include: {
        submittedBy: { select: { id: true, name: true, image: true } },
        answeredBy: { select: { id: true, name: true, image: true } },
      }
    });

    // 6. Return the Updated Question Data
    return NextResponse.json(updatedQuestion as AMAQuestionData, { status: 200 }); // Cast to ensure type safety for response

  } catch (error) {
    console.error("API Error - PATCH /api/ama/questions/[questionId]/answer:", error);
    // Generic error for unexpected issues
    return NextResponse.json({ message: 'An error occurred while submitting the answer.' }, { status: 500 });
  }
}

// Optional: Add handler for other methods if needed, otherwise they default to 405 Method Not Allowed
// export async function GET(request: Request, { params }: { params: { questionId: string } }) {
//   return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
// }
// export async function POST(...) etc.
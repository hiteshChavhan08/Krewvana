// app/api/questions/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next'; // Adjust if using a different auth provider
// import { authOptions } from '@/lib/auth'; 
import { authOptions } from "@/app/api/auth/[...nextauth]/route";// Your NextAuth options
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Zod schema for validation
const createQuestionSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long').max(200),
  content: z.any(), // Use z.any() for JSON from Plate.js, validate structure if needed
  tags: z.array(z.string().min(1).max(50)).min(1, 'At least one tag is required').max(5),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions); // Get user session

  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  try {
    const json = await request.json();
    const body = createQuestionSchema.parse(json);

    // Transaction to create question, find/create tags, and link them
    const question = await prisma.$transaction(async (tx) => {
      const createdQuestion = await tx.question.create({
        data: {
          title: body.title,
          content: body.content as Prisma.InputJsonValue, // Cast Plate.js JSON
          authorId: session.user.id,
        },
      });

      // Handle Tags: Find existing or create new ones
      const tagOps = body.tags.map((tagName) =>
        tx.tag.upsert({
          where: { name: tagName },
          update: {}, // No update needed if exists
          create: { name: tagName },
        })
      );
      const tags = await Promise.all(tagOps);

      // Link tags to the question
      await tx.questionTag.createMany({
        data: tags.map((tag) => ({
          questionId: createdQuestion.id,
          tagId: tag.id,
        })),
      });

      return createdQuestion; // Return the created question from transaction
    });


    return NextResponse.json(question, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    console.error("Failed to create question:", error);
    return new NextResponse(JSON.stringify({ message: 'Failed to create question' }), { status: 500 });
  }
}

// GET handler for listing questions would also go here...
export async function GET(request: Request) {
    // ... Implementation for fetching question list ...
    // Handle pagination, sorting, filtering by tag
    // Example: Fetch newest questions with author and tags
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const questions = await prisma.question.findMany({
            skip: skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                author: { select: { id: true, name: true, image: true } },
                tags: { include: { tag: true } },
                _count: { select: { answers: true, votes: true } }, // Count related items
                // You might also fetch the current user's vote status if needed
            },
        });

         const totalQuestions = await prisma.question.count(); // For pagination metadata

        return NextResponse.json({
            data: questions,
            meta: {
                total: totalQuestions,
                page,
                limit,
                totalPages: Math.ceil(totalQuestions / limit),
            },
        });

    } catch (error) {
        console.error("Failed to fetch questions:", error);
        return new NextResponse(JSON.stringify({ message: 'Failed to fetch questions' }), { status: 500 });
    }
}
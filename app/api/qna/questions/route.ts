// app/api/questions/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// --- POST Handler (Create Question - already implemented) ---
const createQuestionSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long').max(200),
  content: z.any(),
  tags: z.array(z.string().min(1).max(50)).min(1, 'At least one tag is required').max(5),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  try {
    const json = await request.json();
    const body = createQuestionSchema.parse(json);

    const question = await prisma.$transaction(async (tx) => {
      const createdQuestion = await tx.question.create({
        data: {
          title: body.title,
          content: body.content as Prisma.InputJsonValue,
          authorId: session.user.id,
        },
      });

      const tagOps = body.tags.map((tagName) =>
        tx.tag.upsert({
          where: { name: tagName.toLowerCase() }, // Store tags lowercase for consistency
          update: {},
          create: { name: tagName.toLowerCase() },
        })
      );
      const tags = await Promise.all(tagOps);

      await tx.questionTag.createMany({
        data: tags.map((tag) => ({
          questionId: createdQuestion.id,
          tagId: tag.id,
        })),
      });

      // Return question with author and tags for immediate use if needed
      return tx.question.findUnique({
          where: { id: createdQuestion.id },
          include: {
              author: { select: { id: true, name: true, image: true } },
              tags: { include: { tag: true } }
          }
      });
    });

    return NextResponse.json(question, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return detailed Zod errors
      return new NextResponse(JSON.stringify({ message: "Validation failed", errors: error.flatten().fieldErrors }), { status: 400 });
    }
    console.error("[POST /api/questions] Failed to create question:", error);
    return new NextResponse(JSON.stringify({ message: 'Failed to create question' }), { status: 500 });
  }
}

// --- GET Handler (List Questions) ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Sorting - Default to newest first
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // Allow 'votes', 'answers' later
    const order = searchParams.get('order') || 'desc'; // 'asc' or 'desc'
    let orderBy: Prisma.QuestionOrderByWithRelationInput = {};

    if (sortBy === 'createdAt') {
      orderBy = { createdAt: order as Prisma.SortOrder };
    }
    // Add more sorting options as needed (e.g., by vote count - requires calculating votes)
    // else if (sortBy === 'votes') { ... complex calculation needed ... }

    // Filtering by Tag
    const tagName = searchParams.get('tag')?.toLowerCase(); // Filter by lowercase tag name
    let where: Prisma.QuestionWhereInput = {};
    if (tagName) {
      where = {
        tags: {
          some: {
            tag: {
              name: tagName,
            },
          },
        },
      };
    }

    // Fetch questions and total count in parallel
    const [questions, totalQuestions] = await prisma.$transaction([
      prisma.question.findMany({
        where,
        skip: skip,
        take: limit,
        orderBy,
        include: {
          author: { select: { id: true, name: true, image: true } }, // Select only needed fields
          tags: { include: { tag: { select: { name: true, id: true } } } }, // Select only needed tag fields
          _count: { // Use Prisma's _count for efficiency
            select: {
              answers: true,
              votes: true, // You might want to refine vote counting later (e.g., sum of upvotes)
            },
          },
           // Include acceptedAnswerId to indicate if an answer is accepted
           acceptedAnswer: { select: { id: true } }
        },
      }),
      prisma.question.count({ where }), // Count based on the same filter
    ]);

    // TODO: Fetch current user's vote status for each question if authenticated (more complex)

    const totalPages = Math.ceil(totalQuestions / limit);

    return NextResponse.json({
      data: questions,
      meta: {
        total: totalQuestions,
        page,
        limit,
        totalPages,
      },
    });

  } catch (error) {
    console.error("[GET /api/questions] Failed to fetch questions:", error);
    // Avoid leaking detailed errors to the client in production
    return new NextResponse(JSON.stringify({ message: 'Failed to fetch questions' }), { status: 500 });
  }
}
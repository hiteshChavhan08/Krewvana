// app/api/ideas/[ideaId]/comments/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { IdeaCommentCreateSchema, IdeaCommentsQuerySchema } from '@/lib/schemas'; // Adjust path if needed
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
// Optional: Import awardPoints and PointLogType if comments grant points
// import { awardPoints } from '@/lib/points';
// import { PointLogType } from '@prisma/client';
// Optional: For notifications
// import { createNotification } from '@/lib/notifications'; // You'd create this utility
// import { NotificationType } from '@prisma/client';

interface RouteContext {
  params: {
    ideaId: string;
  };
}

// POST: Create a new comment for an idea
export async function POST(request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { ideaId } = params;

  if (!ideaId) {
    return NextResponse.json({ error: 'Idea ID is required' }, { status: 400 });
  }

  try {
    const ideaExists = await prisma.idea.findUnique({
      where: { id: ideaId },
      select: { id: true, submittedById: true }, // Select submittedById for notifications
    });

    if (!ideaExists) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    const json = await request.json();
    const data = IdeaCommentCreateSchema.parse(json);

    const newComment = await prisma.ideaComment.create({
      data: {
        content: data.content,
        authorId: userId,
        ideaId: ideaId,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    // --- Optional: Award points for commenting ---
    /*
    if (newComment) {
      await awardPoints({
        userId: userId,
        actionType: PointLogType.IDEA_COMMENT_POSTED, // Make sure this enum exists
        reason: `Commented on idea: "${ideaExists.title.substring(0,30)}..."`, // You might need to fetch idea title
        relatedIdeaCommentId: newComment.id,
      });
    }
    */

    // --- Optional: Send notification to idea author ---
    /*
    if (newComment && ideaExists.submittedById !== userId) { // Don't notify user about their own comment
      await createNotification({
        userId: ideaExists.submittedById,
        type: NotificationType.IDEA_NEW_COMMENT, // Make sure this enum exists
        message: `${session.user.name || 'Someone'} commented on your idea.`,
        url: `/ideas/${ideaId}?comment=${newComment.id}`, // Link to the idea, potentially highlighting the comment
        ideaId: ideaId,
        ideaCommentId: newComment.id,
      });
    }
    */

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error(`[API /api/ideas/${ideaId}/comments POST] Error:`, error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

// GET: Fetch comments for an idea (with pagination)
export async function GET(request: Request, { params }: RouteContext) {
  // Session check can be optional for GET, if comments are public
  const session = await getServerSession(authOptions);
  // if (!session?.user?.id) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  const { ideaId } = params;
  if (!ideaId) {
    return NextResponse.json({ error: 'Idea ID is required' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);

  try {
    const queryParams = IdeaCommentsQuerySchema.parse(Object.fromEntries(searchParams));
    const { page, limit, sortBy, order } = queryParams;
    const skip = (page - 1) * limit;

    const ideaExists = await prisma.idea.findUnique({
      where: { id: ideaId },
      select: { id: true },
    });

    if (!ideaExists) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }
    
    const comments = await prisma.ideaComment.findMany({
      where: { ideaId: ideaId },
      skip,
      take: limit,
      orderBy: {
        [sortBy]: order,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        // Include replies if you implement threaded comments
        // _count: { select: { replies: true } } // If you want to show reply count
      },
    });

    const totalComments = await prisma.ideaComment.count({
      where: { ideaId: ideaId },
    });

    return NextResponse.json({
      data: comments,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalComments / limit),
        totalItems: totalComments,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    console.error(`[API /api/ideas/${ideaId}/comments GET] Error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
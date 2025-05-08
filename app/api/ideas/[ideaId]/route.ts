// app/api/ideas/[ideaId]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { IdeaUpdateAPISchema } from '@/lib/schemas'; // Use API specific schema
import { UserRole } from '@prisma/client';
import { ZodError } from 'zod';
// import { deductPointsForIdeaDeletion } from '@/lib/points'; // If you implement this

interface RouteContext {
  params: {
    ideaId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteContext) { // Use NextRequest
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;
  const { ideaId } = params;

  if (!ideaId) {
    return NextResponse.json({ error: 'Idea ID is required' }, { status: 400 });
  }
  try {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: {
        submittedBy: { select: { id: true, name: true, image: true } },
        votes: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false,
        _count: { select: { votes: true, comments: true } },
      },
    });
    if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });

    const processedIdea = {
      ...idea,
      currentUserVoted: currentUserId ? idea.votes.length > 0 : false,
      voteCount: idea._count.votes,
      commentCount: idea._count.comments,
    };
    const { votes, _count, ...restOfIdea } = processedIdea; // Clean response

    return NextResponse.json(restOfIdea);
  } catch (error) {
    console.error(`Error fetching idea ${ideaId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch idea details' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) { // Use NextRequest
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.role) { // Ensure role is available
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const currentUserId = session.user.id;
  const currentUserRole = session.user.role;
  const { ideaId } = params;

  if (!ideaId) {
    return NextResponse.json({ error: 'Idea ID is required' }, { status: 400 });
  }

  try {
    const ideaToUpdate = await prisma.idea.findUnique({
      where: { id: ideaId },
      select: { submittedById: true, status: true },
    });

    if (!ideaToUpdate) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    if (ideaToUpdate.submittedById !== currentUserId && currentUserRole !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const json = await request.json();
    const data = IdeaUpdateAPISchema.parse(json); // Use API specific schema

    const updatePayload: Partial<typeof data> & { updatedAt?: Date } = {}; // Prisma update type
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.category !== undefined) updatePayload.category = data.category;
    if (currentUserRole === UserRole.ADMIN && data.status !== undefined) {
      updatePayload.status = data.status;
    }
    // Prisma handles updatedAt automatically

    if (Object.keys(updatePayload).length === 0) {
        return NextResponse.json({ error: "No valid fields provided for update" }, { status: 400 });
    }


    const updatedIdeaPrisma = await prisma.idea.update({
      where: { id: ideaId },
      data: updatePayload,
      include: {
        submittedBy: { select: { id: true, name: true, image: true } },
        votes: { where: { userId: currentUserId }, select: { id: true } },
        _count: { select: { votes: true, comments: true } },
      },
    });

    const processedUpdatedIdea = {
      ...updatedIdeaPrisma,
      currentUserVoted: updatedIdeaPrisma.votes.length > 0,
      voteCount: updatedIdeaPrisma._count.votes,
      commentCount: updatedIdeaPrisma._count.comments,
    };
    const { votes, _count, ...restOfUpdatedIdea } = processedUpdatedIdea;

    return NextResponse.json(restOfUpdatedIdea);

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error(`Error updating idea ${ideaId}:`, error);
    return NextResponse.json({ error: 'Failed to update idea' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) { // Use NextRequest
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const currentUserId = session.user.id;
  const currentUserRole = session.user.role;
  const { ideaId } = params;

  if (!ideaId) {
    return NextResponse.json({ error: 'Idea ID is required' }, { status: 400 });
  }

  try {
    const ideaToDelete = await prisma.idea.findUnique({
      where: { id: ideaId },
      select: { submittedById: true },
    });

    if (!ideaToDelete) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    if (ideaToDelete.submittedById !== currentUserId && currentUserRole !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.idea.delete({
      where: { id: ideaId },
    });

    return NextResponse.json({ message: 'Idea deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting idea ${ideaId}:`, error);
    return NextResponse.json({ error: 'Failed to delete idea' }, { status: 500 });
  }
}
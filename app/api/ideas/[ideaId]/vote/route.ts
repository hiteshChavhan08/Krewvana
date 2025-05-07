// app/api/ideas/[ideaId]/vote/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: {
    ideaId: string;
  };
}

// POST: Vote for an idea (or toggle vote)
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
    // Check if the idea exists
    const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    // Check if the user has already voted
    const existingVote = await prisma.ideaVote.findUnique({
      where: {
        userId_ideaId: { // Using the compound unique index
          userId: userId,
          ideaId: ideaId,
        },
      },
    });

    let newVoteCount;
    let currentUserVoted;

    if (existingVote) {
      // User has voted, so unvote (remove the vote)
      await prisma.ideaVote.delete({
        where: { id: existingVote.id },
      });
      currentUserVoted = false;
      // TODO: Potentially deduct points if unvoting revokes an award
    } else {
      // User has not voted, so add a vote
      await prisma.ideaVote.create({
        data: {
          userId: userId,
          ideaId: ideaId,
        },
      });
      currentUserVoted = true;
      // TODO: Award points for voting (if applicable and not too frequent)
      // e.g., await awardPoints(userId, 'VOTE_IDEA', 1);
    }

    // Get the updated vote count
    const updatedVoteCount = await prisma.ideaVote.count({
      where: { ideaId: ideaId },
    });

    return NextResponse.json({
      message: currentUserVoted ? 'Vote added successfully' : 'Vote removed successfully',
      ideaId: ideaId,
      voteCount: updatedVoteCount,
      currentUserVoted: currentUserVoted,
    }, { status: 200 });

  } catch (error) {
    console.error(`Error voting for idea ${ideaId}:`, error);
    return NextResponse.json({ error: 'Failed to process vote' }, { status: 500 });
  }
}
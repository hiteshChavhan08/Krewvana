// app/api/ideas/[ideaId]/vote/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { awardPoints, deductPoints } from "@/lib/points";
import { PointLogType } from "@prisma/client";
import { getPointsForAction } from "@/lib/constants";

interface RouteContext {
  params: {
    ideaId: string;
  };
}

// POST: Vote for an idea (or toggle vote)
export async function POST(request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { ideaId } = params;

  if (!ideaId) {
    return NextResponse.json({ error: "Idea ID is required" }, { status: 400 });
  }

  try {
    // Check if the idea exists
    const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // Check if the user has already voted
    const existingVote = await prisma.ideaVote.findUnique({
      where: {
        userId_ideaId: {
          // Using the compound unique index
          userId: userId,
          ideaId: ideaId,
        },
      },
    });

    let newVoteCount;
    let currentUserVoted;

    if (existingVote) {
      // User has voted, so unvote (remove the vote)
      await prisma.ideaVote.delete({ where: { id: existingVote.id } });
      currentUserVoted = false;

      // Deduct points from the idea submitter
      if (idea.submittedById) {
        const pointsForVote = getPointsForAction(
          PointLogType.IDEA_VOTE_RECEIVED
        );
        await deductPoints({
          userId: idea.submittedById,
          actionType: PointLogType.IDEA_VOTE_RECEIVED, // Or a new 'IDEA_VOTE_REMOVED' type
          originalPointsToDeduct: pointsForVote,
          reason: `Vote removed for idea: "${idea.title.substring(0, 50)}${
            idea.title.length > 50 ? "..." : ""
          }"`,
          relatedIdeaId: idea.id,
        });
      }
    } else {
      // User has not voted, so add a vote
      await prisma.ideaVote.create({
        data: { userId: userId, ideaId: ideaId },
      });
      currentUserVoted = true;

      // Award points to the idea submitter
      if (idea.submittedById) {
        await awardPoints({
          userId: idea.submittedById,
          actionType: PointLogType.IDEA_VOTE_RECEIVED,
          reason: `Received vote for idea: "${idea.title.substring(0, 50)}${
            idea.title.length > 50 ? "..." : ""
          }"`,
          relatedIdeaId: idea.id,
        });
      }
    }

    // Get the updated vote count
    const updatedVoteCount = await prisma.ideaVote.count({
      where: { ideaId: ideaId },
    });

    return NextResponse.json(
      {
        message: currentUserVoted
          ? "Vote added successfully"
          : "Vote removed successfully",
        ideaId: ideaId,
        voteCount: updatedVoteCount,
        currentUserVoted: currentUserVoted,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error voting for idea ${ideaId}:`, error);
    return NextResponse.json(
      { error: "Failed to process vote" },
      { status: 500 }
    );
  }
}

// app/api/ideas/[ideaId]/vote/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma"; // Ensure this is your actual prisma client instance
import { awardPoints, deductPoints } from "@/lib/points";
import { PointLogType } from "@prisma/client";
import { getPointsForAction } from "@/lib/constants";

interface RouteContext {
  params: {
    ideaId: string;
  };
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { ideaId: routeIdeaId } =  await params; // Renamed to avoid conflict with idea.id from DB

  if (!routeIdeaId) {
    return NextResponse.json({ error: "Idea ID is required" }, { status: 400 });
  }

  try {
    const idea = await prisma.idea.findUnique({
      where: { id: routeIdeaId },
      select: { id: true, title: true, submittedById: true },
    });

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    const existingVote = await prisma.ideaVote.findUnique({
      where: {
        userId_ideaId: { userId: userId, ideaId: idea.id }, // Use idea.id from fetched idea
      },
      select: { id: true },
    });

    let currentUserVoted: boolean;
    let updatedVoteCount: number;

    if (existingVote) {
      const voteIdToRemove = existingVote.id;
      await prisma.ideaVote.delete({
        where: { id: voteIdToRemove },
      });
      currentUserVoted = false;
      console.log(
        `[API/UnvoteIdea] IdeaVote ${voteIdToRemove} removed for IdeaID: ${idea.id} by UserID: ${userId}`
      );

      if (idea.submittedById) {
        const pointsForVote = getPointsForAction(
          PointLogType.IDEA_VOTE_RECEIVED
        );
        if (pointsForVote > 0) {
          console.log(
            `[API/UnvoteIdea] Attempting to deduct IDEA_VOTE_RECEIVED points from idea author UserID: ${idea.submittedById}, IdeaID: ${idea.id}`
          );
          const deductionResult = await deductPoints({
            userId: idea.submittedById,
            actionType: PointLogType.IDEA_VOTE_RECEIVED,
            originalPointsToDeduct: pointsForVote,
            reason: `Vote removed for idea: "${idea.title.substring(0, 50)}${
              idea.title.length > 50 ? "..." : ""
            }"`,
            ideaId: idea.id, // This links to the Idea model directly in PointLog
            relatedIdeaVoteId: voteIdToRemove, // <<< --- CORRECTED: Use relatedIdeaVoteId --- >>>
          });
          console.log(`[API/UnvoteIdea] deductPoints result:`, deductionResult);
        }
      }
    } else {
      const newVote = await prisma.ideaVote.create({
        data: {
          userId: userId,
          ideaId: idea.id, // Use idea.id from fetched idea
        },
        select: { id: true },
      });
      currentUserVoted = true;
      console.log(
        `[API/VoteIdea] IdeaVote ${newVote.id} added for IdeaID: ${idea.id} by UserID: ${userId}`
      );

      if (idea.submittedById) {
        console.log(
          `[API/VoteIdea] Attempting to award IDEA_VOTE_RECEIVED points to idea author UserID: ${idea.submittedById}, IdeaID: ${idea.id}`
        );
        const pointsResult = await awardPoints({
          userId: idea.submittedById,
          actionType: PointLogType.IDEA_VOTE_RECEIVED,
          reason: `Received vote for idea: "${idea.title.substring(0, 50)}${
            idea.title.length > 50 ? "..." : ""
          }"`,
          ideaId: idea.id, // This links to the Idea model directly in PointLog
          relatedIdeaVoteId: newVote.id, // <<< --- CORRECTED: Use relatedIdeaVoteId --- >>>
        });
        console.log(
          `[API/VoteIdea] awardPoints result for IDEA_VOTE_RECEIVED:`,
          pointsResult
        );
      }
    }

    updatedVoteCount = await prisma.ideaVote.count({
      where: { ideaId: idea.id }, // Use idea.id from fetched idea
    });

    return NextResponse.json(
      {
        message: currentUserVoted
          ? "Vote added successfully"
          : "Vote removed successfully",
        ideaId: idea.id,
        voteCount: updatedVoteCount,
        currentUserVoted: currentUserVoted,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      `[API /api/ideas/${routeIdeaId}/vote] Error voting for idea:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to process vote" },
      { status: 500 }
    );
  }
}

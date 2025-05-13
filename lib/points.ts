// lib/points.ts
import prisma from "@/lib/prisma"; // Corrected import if prisma client is in lib
import { PointLogType } from "@prisma/client";
import { getPointsForAction } from "./constants";

interface AwardPointsBaseParams {
  userId: string;
  actionType: PointLogType;
  reason?: string;
  customPoints?: number;
  // Specific related IDs based on your PointLog model
  relatedKudosId?: string;
  relatedAcceptedAnswerId?: string;
  relatedPostedAnswerId?: string;
  relatedVoteId?: string;
  relatedIdeaVoteId?: string;
  relatedBadgeId?: string;
  ideaId?: string;
  learningResourceId?: string;
  relatedQuestionId?: string;
}

// DeductPointsParams interface remains the same

export async function awardPoints(
  params: AwardPointsBaseParams
): Promise<{ awardedPoints: number; newTotalPoints: number } | null> {
  const { userId, actionType, customPoints, reason, ...relatedIds } = params;
  const pointsToAward = customPoints ?? getPointsForAction(actionType);

  console.log(
    `[awardPoints] Attempting for UserID: ${userId}, Action: ${actionType}, Calculated Points: ${pointsToAward}`
  );

  if (pointsToAward <= 0 && !customPoints) {
    console.log(
      `[awardPoints] Skipping non-positive points award for UserID: ${userId}, Action: ${actionType}`
    );
    return null;
  }

  try {
    // --- FIX IS HERE: Assign the result to createdLog ---
    const createdLog = await prisma.pointLog.create({
      data: {
        userId,
        pointsAwarded: pointsToAward,
        type: actionType,
        reason,
        // These keys MUST match fields in your PointLog model
        kudosId: relatedIds.relatedKudosId,
        acceptedAnswerId: relatedIds.relatedAcceptedAnswerId,
        postedAnswerId: relatedIds.relatedPostedAnswerId,
        relatedVoteId: relatedIds.relatedVoteId,
        relatedIdeaVoteId: relatedIds.relatedIdeaVoteId,
        badgeId: relatedIds.relatedBadgeId,
        ideaId: relatedIds.ideaId,
        learningResourceId: relatedIds.learningResourceId,
        // relatedQuestionId: relatedIds.relatedQuestionId, // if you have this
      },
    });
    // --- END FIX ---

    console.log(
      `[awardPoints] PointLog created: ${createdLog.id} for UserID: ${userId}` // Now createdLog is defined
    );

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: pointsToAward } },
      select: { points: true },
    });
    console.log(
      `[awardPoints] User points updated for UserID: ${userId}. New total: ${updatedUser.points}. Awarded: ${pointsToAward}`
    );

    return { awardedPoints: pointsToAward, newTotalPoints: updatedUser.points };
  } catch (error) {
    console.error(
      `[awardPoints] ERROR for UserID: ${userId}, Action: ${actionType}:`,
      error
    );
    return null;
  }
}
interface DeductPointsParams extends AwardPointsBaseParams {
  originalPointsToDeduct: number; // The positive value of points initially awarded
}
// deductPoints function remains the same as you provided (it was already correct)
export async function deductPoints(
  params: DeductPointsParams
): Promise<{ deductedPoints: number; newTotalPoints: number } | null> {
  const { userId, actionType, originalPointsToDeduct, reason, ...relatedIds } =
    params;
  const pointsToDeductValue = Math.abs(originalPointsToDeduct);

  console.log(
    `[deductPoints] Attempting for UserID: ${userId}, Action: ${actionType}, Original Points to Deduct: ${pointsToDeductValue}`
  );

  if (pointsToDeductValue <= 0) {
    console.warn(
      `[deductPoints] Attempted to deduct non-positive points for ${actionType} from UserID: ${userId}`
    );
    return null;
  }
  try {
    const createdLog = await prisma.pointLog.create({ // This was already correct
      data: {
        userId,
        pointsAwarded: -pointsToDeductValue,
        type: actionType,
        reason: reason || `Points deducted for ${actionType}`,
        // Spread relatedIds, ensure names match PointLog model fields
        kudosId: relatedIds.relatedKudosId,
        acceptedAnswerId: relatedIds.relatedAcceptedAnswerId,
        postedAnswerId: relatedIds.relatedPostedAnswerId,
        relatedVoteId: relatedIds.relatedVoteId,
        relatedIdeaVoteId: relatedIds.relatedIdeaVoteId,
        badgeId: relatedIds.relatedBadgeId,
        ideaId: relatedIds.ideaId,
        learningResourceId: relatedIds.learningResourceId,
        // relatedQuestionId: relatedIds.relatedQuestionId,
      },
    });
    console.log(
      `[deductPoints] PointLog created for deduction: ${createdLog.id} for UserID: ${userId}`
    );

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    const currentPoints = user?.points ?? 0;
    const newPoints = Math.max(0, currentPoints - pointsToDeductValue);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { points: newPoints },
      select: { points: true },
    });
    console.log(
      `[deductPoints] User points updated for UserID: ${userId}. New total: ${updatedUser.points}. Deducted: ${pointsToDeductValue}`
    );

    return {
      deductedPoints: pointsToDeductValue,
      newTotalPoints: updatedUser.points,
    };
  } catch (error) {
    console.error(
      `[deductPoints] ERROR for UserID: ${userId}, Action: ${actionType}:`,
      error
    );
    return null;
  }
}
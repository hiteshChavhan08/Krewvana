// lib/points.ts
import prisma from "@/lib/prisma"; // Corrected import if prisma client is in lib
import { PointLogType } from "@prisma/client";
import { getPointsForAction } from "./constants";

interface AwardPointsBaseParams {
  userId: string;
  actionType: PointLogType;
  reason?: string;
  customPoints?: number;
  relatedKudosId?: string;
  relatedAcceptedAnswerId?: string; // For accepted answers
  relatedPostedAnswerId?: string; // For newly posted answers
  relatedVoteId?: string;
  relatedBadgeId?: string;
  relatedIdeaId?: string;
  relatedResourceId?: string;
  relatedQuestionId?: string;
}

export async function awardPoints(
  params: AwardPointsBaseParams
): Promise<{ awardedPoints: number; newTotalPoints: number } | null> {
  const { userId, actionType, customPoints, reason, ...relatedIds } = params;

  try {
    const pointsToAward = customPoints ?? getPointsForAction(actionType);

    if (pointsToAward <= 0 && !customPoints) {
      // Don't log 0 or negative points unless explicitly custom
      console.log(
        `[PointsSystem] Skipping non-positive points award for action ${actionType} for user ${userId}`
      );
      return null;
    }

    await prisma.pointLog.create({
      data: {
        userId,
        pointsAwarded: pointsToAward,
        type: actionType,
        reason,
        ...relatedIds, // Spread the specific related IDs
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: pointsToAward } },
      select: { points: true },
    });

    console.log(
      `[PointsSystem] Awarded ${pointsToAward} points to user ${userId} for ${actionType}. New total: ${updatedUser.points}.`
    );
    return { awardedPoints: pointsToAward, newTotalPoints: updatedUser.points };
  } catch (error) {
    console.error(
      `[PointsSystem] Failed to award points to user ${userId} for ${actionType}:`,
      error
    );
    return null;
  }
}

interface DeductPointsParams extends AwardPointsBaseParams {
  originalPointsToDeduct: number; // The positive value of points that were initially awarded
}

export async function deductPoints(
  params: DeductPointsParams
): Promise<{ deductedPoints: number; newTotalPoints: number } | null> {
  const {
    userId,
    actionType, // This might be the original action type or a specific 'REMOVED' type
    originalPointsToDeduct,
    reason,
    customPoints, // Not typically used for deduction, but kept for interface consistency
    ...relatedIds
  } = params;

  try {
    if (originalPointsToDeduct <= 0) {
      console.warn(
        `[PointsSystem] Attempted to deduct non-positive points for ${actionType} from user ${userId}`
      );
      return null;
    }

    const pointsToDeductValue = Math.abs(originalPointsToDeduct);

    // Log the deduction as a negative point entry
    await prisma.pointLog.create({
      data: {
        userId,
        pointsAwarded: -pointsToDeductValue, // Store as negative
        type: actionType, // Or a specific 'VOTE_REMOVED' type
        reason: reason || `Points deducted for ${actionType}`,
        ...relatedIds,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    const currentPoints = user?.points ?? 0;
    const newPoints = Math.max(0, currentPoints - pointsToDeductValue); // Ensure points don't go below 0

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { points: newPoints }, // Set to the new calculated points
      select: { points: true },
    });

    console.log(
      `[PointsSystem] Deducted ${pointsToDeductValue} points from user ${userId} for ${actionType}. New total: ${updatedUser.points}.`
    );
    return {
      deductedPoints: pointsToDeductValue,
      newTotalPoints: updatedUser.points,
    };
  } catch (error) {
    console.error(
      `[PointsSystem] Failed to deduct points from user ${userId} for ${actionType}:`,
      error
    );
    return null;
  }
}

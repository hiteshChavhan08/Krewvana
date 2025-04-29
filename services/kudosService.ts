// services/kudosService.ts

import { prisma } from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client"; // Import necessary types
import { z } from "zod";
import {
  ForbiddenError,
  NotFoundError, // Import custom errors
} from "@/lib/api/responses";
import { KudosCreateSchema } from "@/lib/schemas"; // Assuming schema is in lib/schemas

// Define or import AuthenticatedUser type
interface AuthenticatedUser {
  id: string;
  role?: UserRole | null;
  // other fields...
}

// --- Constants ---
const POINTS_FOR_GIVING_KUDOS = 1;
const POINTS_FOR_RECEIVING_KUDOS = 5;
const BADGE_ID_FIRST_KUDOS_GIVEN = "kudos_giver_1";
const BADGE_ID_FIRST_KUDOS_RECEIVED = "kudos_receiver_1";
const BADGE_ID_5_KUDOS_RECEIVED = "kudos_receiver_5";
const KUDOS_RECEIVER_5_THRESHOLD = 5;

// --- Badge Awarding Helper (Internal to this service) ---
async function awardBadge(
  tx: Prisma.TransactionClient,
  userId: string,
  badgeId: string
): Promise<boolean> {
  // Return true if awarded, false if already exists
  const existingBadge = await tx.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId } },
  });

  if (!existingBadge) {
    // Verify badge exists before attempting to award
    const badgeMeta = await tx.badge.findUnique({
      where: { id: badgeId },
      select: { id: true },
    });
    if (!badgeMeta) {
      console.warn(
        `Attempted to award non-existent badge ID: ${badgeId} to user ${userId}`
      );
      return false; // Do not award if badge definition doesn't exist
    }
    await tx.userBadge.create({
      data: { userId, badgeId },
    });
    // TODO: Add notification logic here later?
    return true;
  }
  return false;
}

// --- Service Functions ---

/**
 * Lists the main Kudos feed.
 */
export const listKudosFeed = async (limit: number = 20) => {
  const kudosFeed = await prisma.kudos.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      giver: { select: { id: true, name: true, image: true } },
      receiver: { select: { id: true, name: true, image: true } },
    },
  });
  return kudosFeed;
};

/**
 * Creates a new Kudos record, awards points, logs points, and checks for badges.
 * Uses a transaction to ensure atomicity.
 * @param data - Validated kudos creation data (receiverId, message).
 * @param giver - The authenticated user giving the kudos.
 * @returns The newly created Kudos object with included relations.
 * @throws ApiError (Forbidden, NotFound, BadRequest, etc.) on failure.
 */
export const createKudos = async (
  data: z.infer<typeof KudosCreateSchema>,
  giver: AuthenticatedUser
) => {
  if (!giver?.id) {
    throw new ForbiddenError("Authentication required."); // Should be caught earlier
  }
  if (giver.id === data.receiverId) {
    throw new ForbiddenError("You cannot give Kudos to yourself.");
  }

  let awardedBadgesInfo: string[] = []; // Track awarded badges for logging/response

  // Use Prisma Transaction for atomicity
  const newKudos = await prisma.$transaction(async (tx) => {
    // 1. Verify receiver exists
    const receiver = await tx.user.findUnique({
      where: { id: data.receiverId },
      select: { id: true }, // Select minimal data needed
    });
    if (!receiver) {
      throw new NotFoundError("Receiver user");
    }

    // 2. Create Kudos record
    const createdKudos = await tx.kudos.create({
      data: {
        message: data.message,
        giverId: giver.id,
        receiverId: data.receiverId,
      },
      include: {
        // Include details needed for the immediate response
        giver: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
      },
    });

    // 3. Update points & log for giver
    await tx.user.update({
      where: { id: giver.id },
      data: { points: { increment: POINTS_FOR_GIVING_KUDOS } },
    });
    await tx.pointLog.create({
      data: {
        userId: giver.id,
        pointsAwarded: POINTS_FOR_GIVING_KUDOS,
        reason: "Gave Kudos",
        kudosId: createdKudos.id,
      },
    });

    // 4. Update points & log for receiver
    await tx.user.update({
      where: { id: data.receiverId },
      data: { points: { increment: POINTS_FOR_RECEIVING_KUDOS } },
    });
    await tx.pointLog.create({
      data: {
        userId: data.receiverId,
        pointsAwarded: POINTS_FOR_RECEIVING_KUDOS,
        reason: "Received Kudos",
        kudosId: createdKudos.id,
      },
    });

    // --- 5. Check and Award Badges ---
    // Giver: First Kudos Given
    const giverKudosCount = await tx.kudos.count({
      where: { giverId: giver.id },
    });
    if (giverKudosCount === 1) {
      const awarded = await awardBadge(
        tx,
        giver.id,
        BADGE_ID_FIRST_KUDOS_GIVEN
      );
      if (awarded) awardedBadgesInfo.push("Giver earned 'First Kudos'");
    }

    // Receiver: First Kudos Received
    const receiverKudosCount = await tx.kudos.count({
      where: { receiverId: data.receiverId },
    });
    if (receiverKudosCount === 1) {
      const awarded = await awardBadge(
        tx,
        data.receiverId,
        BADGE_ID_FIRST_KUDOS_RECEIVED
      );
      if (awarded) awardedBadgesInfo.push("Receiver earned 'Appreciated'");
    }

    // Receiver: 5 Kudos Received
    if (receiverKudosCount === KUDOS_RECEIVER_5_THRESHOLD) {
      const awarded = await awardBadge(
        tx,
        data.receiverId,
        BADGE_ID_5_KUDOS_RECEIVED
      );
      if (awarded) awardedBadgesInfo.push("Receiver earned 'Valued Colleague'");
    }
    // --- End Badge Awarding ---

    // Log awarded badges (optional)
    if (awardedBadgesInfo.length > 0) {
      console.log(
        `Badges awarded in transaction for Kudos ${
          createdKudos.id
        }: ${awardedBadgesInfo.join(", ")}`
      );
    }

    return createdKudos; // Return the result from the transaction
  });

  // Optionally include awarded badges info in the response if needed by UI
  // return { ...newKudos, awardedBadges: awardedBadgesInfo };
  return newKudos;
};

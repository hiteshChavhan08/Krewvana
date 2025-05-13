// services/kudosService.ts

import { prisma } from "@/lib/prisma";
import {
  Prisma,
  UserRole,
  KudosCategory,
  NotificationType,
} from "@prisma/client"; // Added NotificationType
import { z } from "zod";
import {
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from "@/lib/api/responses";
import { KudosCreateSchema } from "@/lib/schemas";

// Define or import AuthenticatedUser type
interface AuthenticatedUser {
  id: string;
  name?: string | null; // Add name for notification message
  role?: UserRole | null;
  // other fields...
}

// --- Constants ---
const POINTS_FOR_GIVING_KUDOS = 1;
const POINTS_FOR_RECEIVING_KUDOS = 5;
const BADGE_ID_FIRST_KUDOS_GIVEN = "badge_kudos_giver_1";
const BADGE_ID_FIRST_KUDOS_RECEIVED = "badge_kudos_receiver_1";
const BADGE_ID_5_KUDOS_RECEIVED = "badge_kudos_receiver_5";
const KUDOS_RECEIVER_5_THRESHOLD = 5;

// --- Badge Awarding Helper ---
async function awardBadge(
  tx: Prisma.TransactionClient,
  userId: string,
  badgeId: string
): Promise<{ awarded: boolean; badgeName?: string }> {
  // ... (badge awarding logic - unchanged) ...
  const existingBadge = await tx.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId } },
  });

  if (!existingBadge) {
    const badgeMeta = await tx.badge.findUnique({
      where: { id: badgeId },
      select: { id: true, name: true },
    });
    if (!badgeMeta) {
      console.warn(
        `Attempted to award non-existent badge ID: ${badgeId} to user ${userId}`
      );
      return { awarded: false };
    }
    await tx.userBadge.create({
      data: { userId, badgeId },
    });
    // Consider adding a separate notification for badge awards here
    console.log(
      `Awarded badge '${badgeMeta.name}' (ID: ${badgeId}) to user ${userId}`
    );
    return { awarded: true, badgeName: badgeMeta.name };
  }
  return { awarded: false };
}

// --- Service Functions ---

/**
 * Lists the main Kudos feed.
 */
export const listKudosFeed = async (limit: number = 20) => {
  // ... (listKudosFeed logic - unchanged) ...
  const kudosFeed = await prisma.kudos.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      giver: { select: { id: true, name: true, image: true } },
      receiver: { select: { id: true, name: true, image: true } },
      kudosCategories: {
        select: {
          category: {
            select: { id: true, name: true, description: true, iconName: true },
          },
        },
      },
      _count: {
        select: { likes: true, comments: true },
      },
    },
  });
  return kudosFeed.map((k) => ({
    ...k,
    likes: k._count?.likes ?? 0,
    comments: k._count?.comments ?? 0,
  }));
};

/**
 * Creates a new Kudos record, links categories, awards points, logs points,
 * checks for badges, and sends a notification, all within a transaction.
 */
export const createKudos = async (
  data: z.infer<typeof KudosCreateSchema>,
  giver: AuthenticatedUser // Ensure giver includes 'name' if needed for message
) => {
  const { receiverId, message, categoryIds } = data;

  if (!giver?.id) throw new ForbiddenError("Authentication required.");
  if (giver.id === receiverId)
    throw new ForbiddenError("You cannot give Kudos to yourself.");
  if (!categoryIds || categoryIds.length === 0)
    throw new BadRequestError(
      "At least one appreciation category must be selected."
    );

  let awardedBadgesInfo: string[] = [];

  const newKudosWithDetails = await prisma.$transaction(async (tx) => {
    // 1. Verify receiver exists
    const receiver = await tx.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    });
    if (!receiver)
      throw new NotFoundError(`Receiver user with ID ${receiverId}`);

    // 2. Verify selected categories exist
    const validCategoriesCount = await tx.kudosAppreciationCategory.count({
      where: { id: { in: categoryIds } },
    });
    if (validCategoriesCount !== categoryIds.length)
      throw new BadRequestError("One or more selected categories are invalid.");

    // 3. Create Kudos record
    const createdKudos = await tx.kudos.create({
      data: { message: message, giverId: giver.id, receiverId: receiverId },
      select: { id: true }, // Select ID needed for linking
    });

    // 4. Link Categories
    await tx.kudosCategoryLink.createMany({
      data: categoryIds.map((catId) => ({
        kudosId: createdKudos.id,
        categoryId: catId,
      })),
    });

    // 5. Update points & log for giver
    await tx.user.update({
      where: { id: giver.id },
      data: { points: { increment: POINTS_FOR_GIVING_KUDOS } },
    });
    await tx.pointLog.create({
      data: {
        userId: giver.id,
        pointsAwarded: POINTS_FOR_GIVING_KUDOS,
        type: "KUDOS_GIVEN",
        reason: `Gave Kudos to user ${receiverId}`,
        kudosId: createdKudos.id,
      },
    });

    // 6. Update points & log for receiver
    await tx.user.update({
      where: { id: receiverId },
      data: { points: { increment: POINTS_FOR_RECEIVING_KUDOS } },
    });
    await tx.pointLog.create({
      data: {
        userId: receiverId,
        pointsAwarded: POINTS_FOR_RECEIVING_KUDOS,
        type: "KUDOS_RECEIVED",
        reason: `Received Kudos from user ${giver.id}`,
        kudosId: createdKudos.id,
      },
    });

    // --- 7. Check and Award Badges ---
    // Giver: First Kudos Given
    const giverKudosCount = await tx.kudos.count({
      where: { giverId: giver.id },
    });
    if (giverKudosCount === 1) {
      const { awarded, badgeName } = await awardBadge(
        tx,
        giver.id,
        BADGE_ID_FIRST_KUDOS_GIVEN
      );
      if (awarded)
        awardedBadgesInfo.push(
          `Giver earned '${badgeName || BADGE_ID_FIRST_KUDOS_GIVEN}'`
        );
    }
    // Receiver: First & 5th Kudos Received
    const receiverKudosCount = await tx.kudos.count({
      where: { receiverId: receiverId },
    });
    if (receiverKudosCount === 1) {
      const { awarded, badgeName } = await awardBadge(
        tx,
        receiverId,
        BADGE_ID_FIRST_KUDOS_RECEIVED
      );
      if (awarded)
        awardedBadgesInfo.push(
          `Receiver earned '${badgeName || BADGE_ID_FIRST_KUDOS_RECEIVED}'`
        );
    }
    if (receiverKudosCount === KUDOS_RECEIVER_5_THRESHOLD) {
      const { awarded, badgeName } = await awardBadge(
        tx,
        receiverId,
        BADGE_ID_5_KUDOS_RECEIVED
      );
      if (awarded)
        awardedBadgesInfo.push(
          `Receiver earned '${badgeName || BADGE_ID_5_KUDOS_RECEIVED}'`
        );
    }

    // --- 8. Create Notification for Receiver ---
    try {
      await tx.notification.create({
        data: {
          userId: receiverId, // The user receiving the notification
          type: NotificationType.KUDOS_RECEIVED, // Use the enum value
          message: `${giver.name || "Someone"} gave you Kudos!`, // Construct message
          // Optional: Create a URL that links to the specific kudos or feed
          // url: `/app/kudos#${createdKudos.id}`, // Example linking to fragment
          url: `/app/kudos`, // Or link to the main feed
          kudosId: createdKudos.id, // Link the notification to the kudos record
        },
      });
    } catch (notificationError) {
      // Log the error but don't fail the transaction unless notifications are critical
      console.error(
        `Failed to create notification for Kudos ${createdKudos.id} to user ${receiverId}:`,
        notificationError
      );
    }

    // --- 9. Fetch Final Record for Response ---
    const finalKudosRecord = await tx.kudos.findUniqueOrThrow({
      where: { id: createdKudos.id },
      include: {
        giver: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
        kudosCategories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
                description: true,
                iconName: true,
              },
            },
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    if (awardedBadgesInfo.length > 0) {
      console.log(
        `Badges awarded in transaction for Kudos ${
          createdKudos.id
        }: ${awardedBadgesInfo.join(", ")}`
      );
    }

    return finalKudosRecord; // Return the complete record
  });

  // Map to final structure if needed (e.g., counts)
  return {
    ...newKudosWithDetails,
    likes: newKudosWithDetails._count?.likes ?? 0,
    comments: newKudosWithDetails._count?.comments ?? 0,
  };
};

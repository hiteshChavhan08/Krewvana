// app/api/kudos/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { KudosCreateSchema } from "@/lib/schemas";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client"; // Import Prisma types for transaction

// --- Constants for Points ---
const POINTS_FOR_GIVING_KUDOS = 1; // Example value
const POINTS_FOR_RECEIVING_KUDOS = 5; // Example value
// --- Function to award a badge if not already earned ---
async function awardBadge(
  tx: Prisma.TransactionClient,
  userId: string,
  badgeId: string
) {
  const existingBadge = await tx.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId } },
  });

  if (!existingBadge) {
    await tx.userBadge.create({
      data: { userId, badgeId },
    });

    // TODO: Add notification logic here later?
    return true; // Indicate badge was awarded
  }
  return false; // Badge already existed
}
// --- GET Handler (Remains the same) ---
export async function GET(request: Request) {
  // ... same GET logic as before ...
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const take = 20;
  try {
    const kudosFeed = await prisma.kudos.findMany({
      take: take,
      orderBy: { createdAt: "desc" },
      include: {
        giver: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
      },
    });
    return NextResponse.json(kudosFeed, { status: 200 });
  } catch (error) {
    console.error("Error fetching Kudos feed:", error);
    return NextResponse.json(
      { error: "Failed to fetch Kudos feed" },
      { status: 500 }
    );
  }
}

// --- POST Handler: Create New Kudos with Points ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const giverId = session.user.id;

  try {
    const json = await request.json();
    const { receiverId, message } = KudosCreateSchema.parse(json);

    if (giverId === receiverId) {
      return NextResponse.json(
        { error: "You cannot give Kudos to yourself." },
        { status: 403 }
      );
    }
    let awardedBadgesInfo: string[] = []; // Track awarded badges for logging/response
    // --- Use Prisma Transaction ---
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify receiver exists (within transaction for consistency)
      const receiver = await tx.user.findUnique({
        where: { id: receiverId },
        select: { id: true },
      });
      if (!receiver) {
        // Throwing an error inside transaction automatically rolls it back
        throw new Error("Receiver user not found.");
      }

      // 2. Create the Kudos record
      const newKudos = await tx.kudos.create({
        data: {
          message: message,
          giverId: giverId,
          receiverId: receiverId,
        },
        include: {
          // Include details for response
          giver: { select: { id: true, name: true, image: true } },
          receiver: { select: { id: true, name: true, image: true } },
        },
      });

      // 3. Update points for the giver
      await tx.user.update({
        where: { id: giverId },
        data: {
          points: {
            increment: POINTS_FOR_GIVING_KUDOS,
          },
        },
      });
      // 3b. Log points for giver
      await tx.pointLog.create({
        data: {
          userId: giverId,
          pointsAwarded: POINTS_FOR_GIVING_KUDOS,
          reason: "Gave Kudos",
          kudosId: newKudos.id, // Link to the created Kudos
        },
      });
      // 4. Update points for the receiver
      await tx.user.update({
        where: { id: receiverId },
        data: {
          points: {
            increment: POINTS_FOR_RECEIVING_KUDOS,
          },
        },
      });

      // TODO: Could add PointLog entries here later if using that model
      // 4b. Log points for receiver
      await tx.pointLog.create({
        data: {
          userId: receiverId,
          pointsAwarded: POINTS_FOR_RECEIVING_KUDOS,
          reason: "Received Kudos",
          kudosId: newKudos.id, // Link to the created Kudos
        },
      });
      // --- 4. Check and Award Badges ---

      // Giver: Check for "First Kudos Given" (ID: 'kudos_giver_1')
      const giverKudosCount = await tx.kudos.count({
        where: { giverId: giverId },
      });
      if (giverKudosCount === 1) {
        // Award only on the very first one
        const awarded = await awardBadge(tx, giverId, "kudos_giver_1");
        if (awarded) awardedBadgesInfo.push("Giver earned 'First Kudos'");
      }

      // Receiver: Check for "First Kudos Received" (ID: 'kudos_receiver_1')
      const receiverKudosCount = await tx.kudos.count({
        where: { receiverId: receiverId },
      });
      if (receiverKudosCount === 1) {
        // Award only on the very first one
        const awarded = await awardBadge(tx, receiverId, "kudos_receiver_1");
        if (awarded) awardedBadgesInfo.push("Receiver earned 'Appreciated'");
      }

      // Receiver: Check for "5 Kudos Received" (ID: 'kudos_receiver_5')
      const KUDOS_RECEIVER_5_THRESHOLD = 5;
      if (receiverKudosCount === KUDOS_RECEIVER_5_THRESHOLD) {
        // Award when count hits exactly 5
        const awarded = await awardBadge(tx, receiverId, "kudos_receiver_5");
        if (awarded)
          awardedBadgesInfo.push("Receiver earned 'Valued Colleague'");
      }

      // --- End Badge Awarding ---
      return newKudos; // Return the created Kudos object from the transaction
    }); // --- End Prisma Transaction ---

    return NextResponse.json(result, { status: 201 }); // Return Kudos object
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    // Handle specific error from transaction (e.g., receiver not found)
    if (error.message === "Receiver user not found.") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    // Handle potential Prisma transaction errors or other errors
    console.error("Error creating Kudos with transaction:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors if needed
      return NextResponse.json(
        { error: "Database error occurred." },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create Kudos" },
      { status: 500 }
    );
  }
}

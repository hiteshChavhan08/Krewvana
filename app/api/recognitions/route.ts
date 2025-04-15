// --- File: app/api/recognitions/route.ts ---
// (Refined version of previously provided route)
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Prisma } from '@prisma/client'; // Import Prisma types if needed

// GET handler (remains largely the same as before)
export async function GET(request: Request) {
  try {
    const recognitions = await prisma.recognition.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        giver: { select: { id: true, name: true, image: true } },
        recipient: { select: { id: true, name: true, image: true } },
        badgeAwarded: { select: { id: true, name: true, imageUrl: true } } // Use correct relation name
      },
    });
    return NextResponse.json(recognitions);
  } catch (error) {
    console.error("Error fetching recognitions:", error);
    return NextResponse.json({ error: 'Failed to fetch recognitions' }, { status: 500 });
  }
}

// POST handler (Refined with badge/point logic)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const giverId = session.user.id;

  try {
    const body = await request.json();
    const { recipientId, message, valueTag, points, badgeId, isPublic } = body;

    // ** TODO: Add Zod validation for the request body **
    if (!recipientId || !message) {
      return NextResponse.json({ error: 'Recipient ID and message are required' }, { status: 400 });
    }
    if (giverId === recipientId) {
        return NextResponse.json({ error: 'Cannot recognize yourself' }, { status: 400 });
    }

    // Use a Prisma transaction to ensure atomicity if multiple operations are needed
    const result = await prisma.$transaction(async (tx) => {
        // 1. Validate recipient and badge (if provided)
        const recipientExists = await tx.user.findUnique({ where: { id: recipientId } });
        if (!recipientExists) throw new Error('Recipient not found');

        let badgeExists = null;
        if (badgeId) {
            badgeExists = await tx.badge.findUnique({ where: { id: badgeId } });
            if (!badgeExists) throw new Error('Badge not found');
        }

        // 2. TODO: Check if giver has enough points to give (if points are deducted)
        // Example: const giverProfile = await tx.profile.findUnique({ where: { userId: giverId } });
        // if (points && giverProfile && giverProfile.points < points) {
        //     throw new Error('Insufficient points');
        // }

        // 3. Create the Recognition record
        const newRecognition = await tx.recognition.create({
            data: {
                giverId: giverId,
                recipientId,
                message,
                valueTag,
                points: points ? parseInt(points, 10) : undefined,
                badgeId: badgeExists ? badgeId : undefined, // Link badge if it exists
                isPublic: isPublic !== undefined ? isPublic : true,
            },
            include: { // Include details for the response
                giver: { select: { id: true, name: true, image: true } },
                recipient: { select: { id: true, name: true, image: true } },
                badgeAwarded: { select: { id: true, name: true, imageUrl: true } }
            },
        });

        // 4. Update recipient's points (if points are awarded)
        if (points && points > 0) {
            await tx.profile.update({
                where: { userId: recipientId },
                data: { points: { increment: parseInt(points, 10) } },
            });
            // TODO: Handle case where recipient profile doesn't exist? (Should ideally exist)
        }

        // 5. Create UserBadge entry if a badge was awarded and doesn't exist yet
        let userBadge = null;
        if (badgeExists) {
             userBadge = await tx.userBadge.upsert({
                where: { userId_badgeId: { userId: recipientId, badgeId: badgeId } },
                update: {}, // Don't update if they already have it
                create: {
                    userId: recipientId,
                    badgeId: badgeId,
                    recognitionId: newRecognition.id, // Link UserBadge to the Recognition
                }
            });
            // If upsert created a new badge, link the recognition back to it
             if (userBadge.recognitionId !== newRecognition.id) {
                 await tx.recognition.update({
                    where: { id: newRecognition.id },
                    data: { userBadgeGrant: { connect: { id: userBadge.id } } }
                 });
             }
        }

        // 6. TODO: Deduct points from giver (if applicable)

        // 7. TODO: Create Notification for the recipient

        return newRecognition; // Return the created recognition object
    }); // End transaction

    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error("Error creating recognition:", error);
    // Provide more specific error messages based on the caught error
    if (error.message === 'Recipient not found' || error.message === 'Badge not found') {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.message === 'Insufficient points') {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    // Handle potential Prisma transaction errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle specific Prisma errors if needed
    }
    return NextResponse.json({ error: 'Failed to create recognition' }, { status: 500 });
  }
}
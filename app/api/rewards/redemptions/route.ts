// app/api/rewards/redemptions/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getAuthenticatedUserId } from '@/lib/session';

const redemptionSchema = z.object({
    itemId: z.string().cuid({ message: "Invalid reward item ID format" }),
});

export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validation = redemptionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }
        const { itemId } = validation.data;

        // --- Transaction for Redemption ---
        const newRedemption = await prisma.$transaction(async (tx) => {
            // 1. Get Item details (and lock row if needed, depends on DB and isolation level)
            const item = await tx.rewardItem.findUnique({
                where: { id: itemId },
            });

            if (!item) {
                throw new Error("ITEM_NOT_FOUND"); // Custom error identifier
            }
            if (!item.isActive) {
                 throw new Error("ITEM_NOT_ACTIVE");
            }

            // 2. Get User Profile points
            const profile = await tx.profile.findUnique({
                where: { userId: userId },
                select: { points: true, id: true } // Select profile id if needed later
            });

            if (!profile) {
                // This shouldn't happen if profiles are created correctly
                throw new Error("PROFILE_NOT_FOUND");
            }

            // 3. Check sufficient points
            if (profile.points < item.pointsCost) {
                throw new Error("INSUFFICIENT_POINTS");
            }

            // 4. Check stock (if stock is not null)
            if (item.stock !== null) {
                if (item.stock <= 0) {
                    throw new Error("OUT_OF_STOCK");
                }
                // Decrement stock
                await tx.rewardItem.update({
                    where: { id: itemId },
                    data: { stock: { decrement: 1 } }
                });
            }

            // 5. Decrement user points
            await tx.profile.update({
                where: { userId: userId },
                data: { points: { decrement: item.pointsCost } }
            });

            // 6. Create Redemption record
            const redemption = await tx.redemption.create({
                data: {
                    userId: userId,
                    itemId: itemId,
                    pointsSpent: item.pointsCost,
                    status: 'Pending', // Initial status
                },
                 select: { // Select fields to return
                    id: true,
                    userId: true,
                    itemId: true,
                    pointsSpent: true,
                    status: true,
                    redeemedAt: true,
                    item: { select: { name: true, imageUrl: true }} // Include item name/image
                 }
            });

            return redemption; // Return created redemption from transaction
        });

        return NextResponse.json(newRedemption, { status: 201 }); // 201 Created

    } catch (error: any) { // Catch 'any' to check custom error messages
        console.error('Redemption Error:', error);

        // Handle specific transaction errors identified by custom messages
        if (error.message === "ITEM_NOT_FOUND") {
            return NextResponse.json({ message: 'Reward item not found' }, { status: 404 });
        }
        if (error.message === "ITEM_NOT_ACTIVE") {
            return NextResponse.json({ message: 'This reward item is currently not available' }, { status: 400 });
        }
         if (error.message === "PROFILE_NOT_FOUND") {
             // Log this as a server issue
            console.error(`Critical: Profile not found for authenticated user ${await getAuthenticatedUserId()}`);
            return NextResponse.json({ message: 'User profile not found. Please contact support.' }, { status: 500 });
        }
        if (error.message === "INSUFFICIENT_POINTS") {
            return NextResponse.json({ message: 'Insufficient points to redeem this item' }, { status: 400 });
        }
        if (error.message === "OUT_OF_STOCK") {
            return NextResponse.json({ message: 'This item is currently out of stock' }, { status: 400 });
        }

        // Handle standard errors
         if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid input', errors: error.flatten().fieldErrors }, { status: 400 });
         }
         if (error instanceof SyntaxError) {
            return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
        }
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle potential DB errors during update/create if not caught by checks
             console.error("Prisma Error during Redemption:", error.code, error.meta);
            return NextResponse.json({ message: 'Database error during redemption process' }, { status: 500 });
         }
         if (!await getAuthenticatedUserId()) { // Re-check auth just in case
             return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Default error
        return NextResponse.json({ message: 'An error occurred during redemption' }, { status: 500 });
    }
}
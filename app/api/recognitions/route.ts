// app/api/recognitions/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getAuthenticatedUserId } from '@/lib/session';

// --- GET Logic (Recognition Feed) ---

const listRecognitionsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(15),
    // Add filters if needed, e.g., by valueTag, department (requires joins/more complex query)
    // valueTag: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
        const validation = listRecognitionsQuerySchema.safeParse(queryParams);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid query parameters', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        const { page, limit } = validation.data;
        const skip = (page - 1) * limit;

        const whereClause: Prisma.RecognitionWhereInput = {
            isPublic: true, // Only fetch public recognitions for the main feed
        };

        // Add other filters based on query params here if implemented

        const recognitions = await prisma.recognition.findMany({
            where: whereClause,
            skip: skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { // Include details for the feed display
                giver: {
                    select: { id: true, name: true, image: true, profile: { select: { department: true, jobTitle: true }} }
                },
                recipient: {
                    select: { id: true, name: true, image: true, profile: { select: { department: true, jobTitle: true }} }
                },
                badgeAwarded: { // If a badge was directly linked
                    select: { id: true, name: true, imageUrl: true }
                }
            }
        });

        const totalRecognitions = await prisma.recognition.count({ where: whereClause });
        const totalPages = Math.ceil(totalRecognitions / limit);

        return NextResponse.json({
            data: recognitions,
            pagination: { currentPage: page, totalPages, totalRecognitions, limit }
        });

    } catch (error) {
        console.error('List Recognitions Error:', error);
         if (error instanceof z.ZodError) {
             return NextResponse.json({ message: 'Invalid query parameters', errors: error.flatten().fieldErrors }, { status: 400 });
        }
        return NextResponse.json({ message: 'An error occurred listing recognitions' }, { status: 500 });
    }
}


// --- POST Logic (Create Recognition) ---

const createRecognitionSchema = z.object({
    // Allow single recipient or array of recipients
    recipientIds: z.union([
        z.string().cuid("Invalid recipient ID format"),
        z.array(z.string().cuid("Invalid recipient ID format")).min(1, "At least one recipient is required")
    ]),
    message: z.string().min(5, "Message must be at least 5 characters").max(1000),
    valueTag: z.string().max(50).optional().nullable(),
    points: z.coerce.number().int().positive("Points must be a positive number").optional(),
    badgeId: z.string().cuid("Invalid badge ID format").optional().nullable(),
    isPublic: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
    try {
        const giverId = await getAuthenticatedUserId();
        if (!giverId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validation = createRecognitionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }
        const { recipientIds: rawRecipientIds, message, valueTag, points, badgeId, isPublic } = validation.data;

        // Normalize recipientIds to always be an array
        const recipientIds = Array.isArray(rawRecipientIds) ? rawRecipientIds : [rawRecipientIds];

        // Prevent self-recognition
        if (recipientIds.includes(giverId)) {
            return NextResponse.json({ message: 'You cannot give recognition to yourself' }, { status: 400 });
        }

        // --- Validation: Check if recipients exist ---
        const recipients = await prisma.user.findMany({
            where: { id: { in: recipientIds } },
            select: { id: true }
        });
        if (recipients.length !== recipientIds.length) {
            const foundIds = recipients.map(r => r.id);
            const notFoundIds = recipientIds.filter(id => !foundIds.includes(id));
             return NextResponse.json({ message: `Recipient users not found: ${notFoundIds.join(', ')}` }, { status: 404 });
        }

        // --- Validation: Check if badge exists (if provided) ---
        if (badgeId) {
             const badgeExists = await prisma.badge.findUnique({ where: { id: badgeId }, select: { id: true } });
             if (!badgeExists) {
                return NextResponse.json({ message: `Badge with ID ${badgeId} not found` }, { status: 404 });
             }
        }

        // --- Transaction Time! ---
        // We need to potentially:
        // 1. Create Recognition record(s)
        // 2. Update recipient Profile points (if points > 0)
        // 3. Create UserBadge record(s) (if badgeId is provided)

        const createdRecognitions = [];

        for (const recipientId of recipientIds) {
            try {
                const result = await prisma.$transaction(async (tx) => {
                    // 1. Create the Recognition
                    const recognition = await tx.recognition.create({
                        data: {
                            giverId: giverId,
                            recipientId: recipientId,
                            message: message,
                            valueTag: valueTag,
                            points: points,
                            badgeId: badgeId, // Link badge directly if provided
                            isPublic: isPublic,
                        },
                         include: { // Include details for the response
                            giver: { select: { id: true, name: true, image: true } },
                            recipient: { select: { id: true, name: true, image: true } },
                            badgeAwarded: { select: { id: true, name: true, imageUrl: true } }
                        }
                    });

                    // 2. Update points if necessary
                    if (points && points > 0) {
                        await tx.profile.update({
                            where: { userId: recipientId },
                            data: {
                                points: { increment: points }
                            }
                        });
                        // Note: Assumes profile exists. Add error handling or check if needed.
                    }

                    // 3. Create UserBadge if necessary
                    let userBadge = null;
                    if (badgeId) {
                        // Use createMany with skipDuplicates, or handle potential P2002 error
                        try {
                            userBadge = await tx.userBadge.create({
                                data: {
                                    userId: recipientId,
                                    badgeId: badgeId,
                                    recognitionId: recognition.id, // Link the recognition that granted it
                                }
                            });
                         } catch (e) {
                             if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                                 console.warn(`User ${recipientId} already has badge ${badgeId}. Skipping UserBadge creation for recognition ${recognition.id}.`);
                                 // Optionally fetch the existing UserBadge if needed later
                             } else {
                                 throw e; // Re-throw other errors to fail the transaction
                             }
                         }
                    }

                    return recognition; // Return the created recognition from the transaction
                }); // End Transaction for one recipient
                 createdRecognitions.push(result);
            } catch (txError) {
                console.error(`Transaction failed for recipient ${recipientId}:`, txError);
                // Decide how to handle partial failures. Stop all? Return partial success?
                // Here, we'll stop and return an error for the first failure.
                if (txError instanceof Prisma.PrismaClientKnownRequestError && txError.code === 'P2025') {
                     // Likely profile update failed because profile doesn't exist for recipient
                    return NextResponse.json({ message: `Failed to update points: Profile not found for recipient ${recipientId}.` }, { status: 404 });
                }
                 return NextResponse.json({ message: `Failed to create recognition for recipient ${recipientId}. Error: ${ (txError as Error).message }` }, { status: 500 });
            }
        } // End loop over recipients


        // Return the list of created recognitions (or just the first one if only one recipient)
        return NextResponse.json(createdRecognitions.length === 1 ? createdRecognitions[0] : createdRecognitions, { status: 201 });

    } catch (error) {
        console.error('Create Recognition Error:', error);
         if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid input', errors: error.flatten().fieldErrors }, { status: 400 });
         }
         if (error instanceof SyntaxError) {
            return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
        }
         if (!await getAuthenticatedUserId()) {
             return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'An error occurred creating the recognition' }, { status: 500 });
    }
}
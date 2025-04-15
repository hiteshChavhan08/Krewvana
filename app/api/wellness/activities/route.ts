// app/api/wellness/activities/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getAuthenticatedUserId } from '@/lib/session';

const activitySchema = z.object({
    type: z.string().min(1, "Activity type is required").max(100), // e.g., "Running", "Yoga", "Steps"
    date: z.coerce.date({ message: "Invalid date format" }), // Coerce string/number to Date
    duration: z.coerce.number().int().positive("Duration must be positive minutes").optional(),
    distance: z.coerce.number().positive("Distance must be positive").optional(),
    steps: z.coerce.number().int().positive("Steps must be positive").optional(),
    calories: z.coerce.number().int().positive("Calories must be positive").optional(),
    // Add other fields as needed
});

// Helper function to determine progress contribution
function getActivityContribution(activity: z.infer<typeof activitySchema>, challengeType: string): number | null {
    switch (challengeType.toLowerCase()) {
        case 'steps':
            return activity.steps ?? null;
        case 'activityminutes': // Assuming 'ActivityMinutes' is a challenge type
            return activity.duration ?? null;
        case 'distance': // Assuming 'Distance' is a challenge type
            return activity.distance ?? null;
        // Add cases for other challenge types (e.g., specific activity counts like 'Yoga Sessions')
        default:
            // If activity type doesn't directly match challenge type (e.g., "Running" activity for "Distance" challenge)
            // You might need more complex logic here if needed.
            // For now, assume direct match or specific metrics like distance/steps/duration.
            return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validation = activitySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }
        const activityData = validation.data;
        const now = new Date();

        // --- Transaction to log activity AND update progress ---
        const createdActivity = await prisma.$transaction(async (tx) => {
            // 1. Create the WellnessActivity record
            const newActivity = await tx.wellnessActivity.create({
                data: {
                    userId: userId,
                    type: activityData.type,
                    date: activityData.date,
                    duration: activityData.duration,
                    distance: activityData.distance,
                    steps: activityData.steps,
                    calories: activityData.calories,
                    source: 'Manual', // Mark as manually logged
                }
            });

            // 2. Find active challenges the user is participating in
            const activeParticipations = await tx.challengeParticipant.findMany({
                where: {
                    userId: userId,
                    wellnessChallenge: { // Filter by active challenges
                        startDate: { lte: now },
                        endDate: { gte: now },
                    }
                },
                include: {
                    wellnessChallenge: { // Include challenge details (like type)
                        select: { id: true, type: true }
                    }
                }
            });

            // 3. Update progress for relevant challenges
            for (const participation of activeParticipations) {
                const contribution = getActivityContribution(activityData, participation.wellnessChallenge.type);

                if (contribution !== null && contribution > 0) {
                    await tx.challengeParticipant.update({
                        where: { id: participation.id },
                        data: {
                            progress: { increment: contribution }
                        }
                    });
                    console.log(`Updated progress for challenge ${participation.wellnessChallengeId} by ${contribution} for user ${userId}`);
                }
            }

            return newActivity; // Return the created activity from the transaction
        });

        return NextResponse.json(createdActivity, { status: 201 }); // 201 Created

    } catch (error) {
        console.error('Log Activity Error:', error);
         if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid input', errors: error.flatten().fieldErrors }, { status: 400 });
         }
         if (error instanceof SyntaxError) {
            return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
        }
        // Handle potential transaction errors (e.g., constraint violations if logic changes)
         if (!await getAuthenticatedUserId()) {
             return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'An error occurred logging the activity' }, { status: 500 });
    }
}
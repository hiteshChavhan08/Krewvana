// app/api/wellness/challenges/[challengeId]/progress/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getAuthenticatedUserId } from '@/lib/session'; // Auth needed to view progress

type RouteParams = { params: { challengeId: string } };

const paramsSchema = z.object({
    challengeId: z.string().cuid({ message: "Invalid challenge ID format" })
});

// Query params to optionally get progress for a specific user (if allowed by roles/permissions)
// or for a team (if team logic is implemented). For now, defaults to logged-in user.
const querySchema = z.object({
    userId: z.string().cuid("Invalid user ID format").optional(),
    // teamId: z.string().optional(), // Add if team progress view is needed
});


export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const loggedInUserId = await getAuthenticatedUserId();
        if (!loggedInUserId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const paramsValidation = paramsSchema.safeParse(params);
        if (!paramsValidation.success) {
            return NextResponse.json({ message: 'Invalid challenge ID format', errors: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
        }
        const { challengeId } = paramsValidation.data;

        const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
        const queryValidation = querySchema.safeParse(queryParams);
        if (!queryValidation.success) {
             return NextResponse.json({ message: 'Invalid query parameters', errors: queryValidation.error.flatten().fieldErrors }, { status: 400 });
        }

        let targetUserId = queryValidation.data.userId;

        // --- Authorization ---
        // If a specific userId is requested, check permissions.
        // Basic: Allow users to only see their own progress unless they are admin/manager.
        if (targetUserId && targetUserId !== loggedInUserId) {
            // Add role check logic here using your session/user data
            const userRole = (await prisma.user.findUnique({ where: { id: loggedInUserId }, select: { role: true } }))?.role;
            if (userRole !== 'ADMIN' && userRole !== 'MANAGER') { // Example roles
                console.warn(`User ${loggedInUserId} (role: ${userRole}) attempted to view progress for user ${targetUserId}`);
                 return NextResponse.json({ message: 'Forbidden: You can only view your own progress' }, { status: 403 });
            }
            // If admin/manager, allow viewing the targetUserId
        } else {
            // If no userId specified, default to the logged-in user
            targetUserId = loggedInUserId;
        }

        // --- Fetch Progress ---
        const participantProgress = await prisma.challengeParticipant.findUnique({
            where: {
                // Compound key for the specific user in the specific challenge
                userId_wellnessChallengeId: {
                    userId: targetUserId,
                    wellnessChallengeId: challengeId,
                }
            },
            include: {
                user: { // Include user details
                    select: { id: true, name: true, image: true }
                },
                wellnessChallenge: { // Include challenge details for context
                    select: { id: true, title: true, goal: true, type: true }
                }
            }
        });

        if (!participantProgress) {
            return NextResponse.json({ message: 'User is not participating in this challenge or challenge not found' }, { status: 404 });
        }

        // Return the fetched progress record
        return NextResponse.json(participantProgress);

    } catch (error) {
        console.error('Get Challenge Progress Error:', error);
         if (error instanceof z.ZodError) { // Handles both param and query validation
            return NextResponse.json({ message: 'Invalid input format', errors: error.flatten().fieldErrors }, { status: 400 });
         }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
             return NextResponse.json({ message: 'Invalid ID format provided.' }, { status: 400 });
        }
         if (!await getAuthenticatedUserId()) {
             return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'An error occurred fetching challenge progress' }, { status: 500 });
    }
}
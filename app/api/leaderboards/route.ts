// app/api/leaderboards/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Define leaderboard types
const leaderboardTypes = [
    'overall_points',
    'recognitions_given_monthly', // Example: Monthly recognitions given
    'recognitions_received_monthly', // Example: Monthly recognitions received
    'challenge_progress', // Requires challengeId param
    // Add more types: 'recognitions_given_weekly', 'recognitions_given_all_time', etc.
] as const;

// Define timeframe calculation logic (simplified for monthly example)
function getTimeframeDates(timeframe: string): { gte?: Date, lt?: Date } {
    const now = new Date();
    let gte: Date | undefined;
    let lt: Date | undefined = new Date(now.getFullYear(), now.getMonth() + 1, 1); // Start of next month

    switch (timeframe) {
        case 'monthly':
            gte = new Date(now.getFullYear(), now.getMonth(), 1); // Start of current month
            break;
        case 'weekly':
            const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
            const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
            gte = new Date(now.setDate(diff));
            gte.setHours(0, 0, 0, 0);
            lt = new Date(gte); // Start of next week (add 7 days)
            lt.setDate(lt.getDate() + 7);
            break;
        // Add 'yearly', 'all_time' etc.
        case 'all_time':
        default:
            // No date filters needed
            break;
    }
     // For 'all_time', we don't filter by date
     if (timeframe === 'all_time') return {};
    return { gte, lt };
}

const querySchema = z.object({
    type: z.enum(leaderboardTypes),
    timeframe: z.enum(['all_time', 'monthly', 'weekly']).default('all_time'), // Example timeframes
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    challengeId: z.string().cuid("Invalid challenge ID format").optional(), // Required if type is 'challenge_progress'
    // teamId: z.string().optional(), // Add if team leaderboards needed
});

export async function GET(request: NextRequest) {
    try {
        // Auth check might be desired depending on leaderboard visibility
        // const userId = await getAuthenticatedUserId();
        // if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
        const validation = querySchema.safeParse(queryParams);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid query parameters', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        const { type, timeframe, page, limit, challengeId } = validation.data;
        const skip = (page - 1) * limit;

        let leaderboardData: any[] = [];
        let totalCount = 0;

        // --- Query Logic based on Leaderboard Type ---

        if (type === 'overall_points') {
            // Simple leaderboard based on current points in Profile
            if (timeframe !== 'all_time') {
                 console.warn("Timeframe ignored for 'overall_points' leaderboard (uses current total points).");
            }
            const profiles = await prisma.profile.findMany({
                where: {
                    // Optionally add filters, e.g., exclude inactive users if User has an isActive flag
                },
                orderBy: { points: 'desc' },
                skip: skip,
                take: limit,
                include: {
                    user: { // Include user details for display
                        select: { id: true, name: true, image: true }
                    }
                }
            });
            leaderboardData = profiles.map((p, index) => ({
                rank: skip + index + 1,
                user: p.user,
                score: p.points, // Score is the total points
                profileId: p.id
            }));
            totalCount = await prisma.profile.count(); // Count all profiles

        } else if (type === 'recognitions_given_monthly' || type === 'recognitions_received_monthly') {
            // Example: Monthly Recognitions (Given or Received)
             const dates = getTimeframeDates('monthly'); // Force monthly for these types
             const groupByField = type === 'recognitions_given_monthly' ? 'giverId' : 'recipientId';

            // Use groupBy and aggregate _count
            const recognitionCounts = await prisma.recognition.groupBy({
                by: [groupByField],
                where: {
                    createdAt: dates, // Filter by timeframe
                },
                _count: {
                    id: true // Count recognitions
                },
                orderBy: {
                    _count: {
                        id: 'desc' // Order by count descending
                    }
                },
                skip: skip,
                take: limit,
            });

            totalCount = (await prisma.recognition.groupBy({
                 by: [groupByField], where: { createdAt: dates }
            })).length; // Get total number of users who gave/received in timeframe

            // Fetch user details for the grouped results
            const userIds = recognitionCounts.map(r => r[groupByField]);
            const users = await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, name: true, image: true }
            });
            const userMap = new Map(users.map(u => [u.id, u]));

            leaderboardData = recognitionCounts.map((r, index) => ({
                rank: skip + index + 1,
                user: userMap.get(r[groupByField]),
                score: r._count.id // Score is the count of recognitions
            }));

        } else if (type === 'challenge_progress') {
            if (!challengeId) {
                 return NextResponse.json({ message: 'challengeId is required for challenge_progress leaderboard type' }, { status: 400 });
            }
             // Leaderboard based on progress in a specific challenge
             const participants = await prisma.challengeParticipant.findMany({
                 where: {
                    wellnessChallengeId: challengeId,
                 },
                 orderBy: { progress: 'desc' },
                 skip: skip,
                 take: limit,
                 include: {
                     user: { // Include user details
                         select: { id: true, name: true, image: true }
                     },
                     wellnessChallenge: { // Include challenge goal for context
                         select: { goal: true, type: true }
                     }
                 }
             });
             leaderboardData = participants.map((p, index) => ({
                rank: skip + index + 1,
                user: p.user,
                score: p.progress, // Score is the progress value
                goal: p.wellnessChallenge.goal, // Provide goal context
                challengeType: p.wellnessChallenge.type
             }));
             totalCount = await prisma.challengeParticipant.count({ where: { wellnessChallengeId: challengeId }});
        }
        // --- Add other leaderboard type logic here ---
        else {
            return NextResponse.json({ message: `Leaderboard type "${type}" not yet implemented` }, { status: 501 }); // Not Implemented
        }

        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
            leaderboardType: type,
            timeframe: timeframe, // Echo back timeframe used
            data: leaderboardData,
            pagination: { currentPage: page, totalPages, totalItems: totalCount, limit }
        });

    } catch (error) {
        console.error('Get Leaderboard Error:', error);
         if (error instanceof z.ZodError) {
             return NextResponse.json({ message: 'Invalid query parameters', errors: error.flatten().fieldErrors }, { status: 400 });
        }
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
             return NextResponse.json({ message: 'Invalid ID format provided.' }, { status: 400 });
        }
        return NextResponse.json({ message: 'An error occurred fetching leaderboard data' }, { status: 500 });
    }
}
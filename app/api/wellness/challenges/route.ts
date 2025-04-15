// app/api/wellness/challenges/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    // Could add filters for type (e.g., 'Steps', 'ActivityMinutes') if needed
    // type: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        // Listing might be public or require login - add auth check if needed
        // const userId = await getAuthenticatedUserId();
        // if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
        const validation = querySchema.safeParse(queryParams);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid query parameters', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        const { page, limit } = validation.data;
        const skip = (page - 1) * limit;
        const now = new Date();

        // Filter for currently active challenges
        const whereClause: Prisma.WellnessChallengeWhereInput = {
            startDate: { lte: now },
            endDate: { gte: now },
            // Add type filter here if implemented
        };

        const challenges = await prisma.wellnessChallenge.findMany({
            where: whereClause,
            skip: skip,
            take: limit,
            orderBy: { endDate: 'asc' }, // Show soonest ending first
            select: { // Select fields for listing
                id: true,
                title: true,
                description: true,
                type: true,
                goal: true,
                startDate: true,
                endDate: true,
                isTeamBased: true,
                // Optionally include participant count
                 _count: { select: { participants: true } }
            }
        });

        const totalChallenges = await prisma.wellnessChallenge.count({ where: whereClause });
        const totalPages = Math.ceil(totalChallenges / limit);

        return NextResponse.json({
            data: challenges,
            pagination: { currentPage: page, totalPages, totalChallenges, limit }
        });

    } catch (error) {
        console.error('List Wellness Challenges Error:', error);
         if (error instanceof z.ZodError) {
             return NextResponse.json({ message: 'Invalid query parameters', errors: error.flatten().fieldErrors }, { status: 400 });
        }
        return NextResponse.json({ message: 'An error occurred listing wellness challenges' }, { status: 500 });
    }
}
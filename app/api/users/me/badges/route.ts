// app/api/users/me/badges/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getAuthenticatedUserId } from '@/lib/session';

const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
});

export async function GET(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
        const validation = querySchema.safeParse(queryParams);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid query parameters', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        const { page, limit } = validation.data;
        const skip = (page - 1) * limit;

        // Find UserBadge entries for the user and include the Badge details
        const userBadges = await prisma.userBadge.findMany({
            where: { userId: userId },
            skip: skip,
            take: limit,
            orderBy: { earnedAt: 'desc' }, // Show most recently earned first
            include: {
                badge: { // Include full badge details
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        imageUrl: true,
                        criteria: true,
                    }
                },
                // Optionally include the recognition that granted it
                // recognition: { select: { id: true, message: true, giver: { select: { name: true }} } }
            }
        });

        const totalUserBadges = await prisma.userBadge.count({ where: { userId: userId } });
        const totalPages = Math.ceil(totalUserBadges / limit);

        // Format response to be a list of badges with earned date
        const formattedData = userBadges.map(ub => ({
            ...ub.badge, // Spread the badge details
            earnedAt: ub.earnedAt,
            userBadgeId: ub.id, // Include the UserBadge relation ID if needed
            // recognitionId: ub.recognitionId // Include if recognition relation is fetched
        }));

        return NextResponse.json({
            data: formattedData,
            pagination: { currentPage: page, totalPages, totalUserBadges, limit }
        });

    } catch (error) {
        console.error('List My Badges Error:', error);
         if (error instanceof z.ZodError) {
             return NextResponse.json({ message: 'Invalid query parameters', errors: error.flatten().fieldErrors }, { status: 400 });
        }
        if (!await getAuthenticatedUserId()) {
             return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'An error occurred fetching your badges' }, { status: 500 });
    }
}
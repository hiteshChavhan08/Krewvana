// app/api/badges/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20), // Allow more badges per page
});

export async function GET(request: NextRequest) {
    try {
        // Listing all badges might not require authentication, depending on policy
        // const userId = await getAuthenticatedUserId();
        // if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
        const validation = querySchema.safeParse(queryParams);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid query parameters', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        const { page, limit } = validation.data;
        const skip = (page - 1) * limit;

        const badges = await prisma.badge.findMany({
            skip: skip,
            take: limit,
            orderBy: { name: 'asc' }, // Order alphabetically
            // Select all fields usually needed for badge display
             select: {
                 id: true,
                 name: true,
                 description: true,
                 imageUrl: true,
                 criteria: true,
                 createdAt: true,
             }
        });

        const totalBadges = await prisma.badge.count();
        const totalPages = Math.ceil(totalBadges / limit);

        return NextResponse.json({
            data: badges,
            pagination: { currentPage: page, totalPages, totalBadges, limit }
        });

    } catch (error) {
        console.error('List Badges Error:', error);
         if (error instanceof z.ZodError) {
             return NextResponse.json({ message: 'Invalid query parameters', errors: error.flatten().fieldErrors }, { status: 400 });
        }
        return NextResponse.json({ message: 'An error occurred listing badges' }, { status: 500 });
    }
}
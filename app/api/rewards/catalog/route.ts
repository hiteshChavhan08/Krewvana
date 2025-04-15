// app/api/rewards/catalog/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
});

export async function GET(request: NextRequest) {
    try {
        // Viewing catalog usually doesn't require auth, add if needed
        // const userId = await getAuthenticatedUserId();
        // if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
        const validation = querySchema.safeParse(queryParams);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid query parameters', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        const { page, limit } = validation.data;
        const skip = (page - 1) * limit;

        // Fetch only active items
        const whereClause: Prisma.RewardItemWhereInput = {
            isActive: true,
        };

        const items = await prisma.rewardItem.findMany({
            where: whereClause,
            skip: skip,
            take: limit,
            orderBy: { pointsCost: 'asc' }, // Example: order by points cost
            select: { // Select fields relevant for catalog display
                id: true,
                name: true,
                description: true,
                imageUrl: true,
                pointsCost: true,
                stock: true, // Show stock if applicable
                isActive: true,
            }
        });

        const totalItems = await prisma.rewardItem.count({ where: whereClause });
        const totalPages = Math.ceil(totalItems / limit);

        return NextResponse.json({
            data: items,
            pagination: { currentPage: page, totalPages, totalItems, limit }
        });

    } catch (error) {
        console.error('List Reward Catalog Error:', error);
         if (error instanceof z.ZodError) {
             return NextResponse.json({ message: 'Invalid query parameters', errors: error.flatten().fieldErrors }, { status: 400 });
        }
        return NextResponse.json({ message: 'An error occurred listing the rewards catalog' }, { status: 500 });
    }
}
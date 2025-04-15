// app/api/challenges/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const querySchema = z.object({
    status: z.enum(['active', 'past', 'upcoming', 'all']).default('active'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

export async function GET(request: NextRequest) {
    try {
        const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
        const validation = querySchema.safeParse(queryParams);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid query parameters', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        const { status, page, limit } = validation.data;
        const skip = (page - 1) * limit;
        const now = new Date();

        const whereClause: Prisma.InnovationChallengeWhereInput = {};

        switch (status) {
            case 'active':
                whereClause.startDate = { lte: now };
                whereClause.endDate = { gte: now };
                break;
            case 'past':
                whereClause.endDate = { lt: now };
                break;
            case 'upcoming':
                whereClause.startDate = { gt: now };
                break;
            case 'all':
                // No date filters needed
                break;
        }

        const challenges = await prisma.innovationChallenge.findMany({
            where: whereClause,
            skip: skip,
            take: limit,
            orderBy: status === 'past' ? { endDate: 'desc' } : { startDate: 'asc' }, // Order logic
            select: { // Select fields for listing
                id: true,
                title: true,
                description: true,
                theme: true,
                startDate: true,
                endDate: true,
                prize: true,
                // Optionally include submission count?
                 _count: { select: { submissions: true } }
            }
        });

        const totalChallenges = await prisma.innovationChallenge.count({ where: whereClause });
        const totalPages = Math.ceil(totalChallenges / limit);

        return NextResponse.json({
            data: challenges,
            pagination: { currentPage: page, totalPages, totalChallenges, limit }
        });

    } catch (error) {
        console.error('List Challenges Error:', error);
         if (error instanceof z.ZodError) {
             return NextResponse.json({ message: 'Invalid query parameters', errors: error.flatten().fieldErrors }, { status: 400 });
        }
        return NextResponse.json({ message: 'An error occurred listing challenges' }, { status: 500 });
    }
}
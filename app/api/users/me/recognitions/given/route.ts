// app/api/users/me/recognitions/given/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getAuthenticatedUserId } from '@/lib/session';

const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
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

        const whereClause: Prisma.RecognitionWhereInput = {
            giverId: userId, // Filter by the logged-in user as giver
        };

        const recognitions = await prisma.recognition.findMany({
            where: whereClause,
            skip: skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { // Include recipient details
                recipient: {
                    select: { id: true, name: true, image: true }
                },
                 badgeAwarded: {
                    select: { id: true, name: true, imageUrl: true }
                }
                // giver is the logged-in user, no need to include self again
            }
        });

        const totalRecognitions = await prisma.recognition.count({ where: whereClause });
        const totalPages = Math.ceil(totalRecognitions / limit);

        return NextResponse.json({
            data: recognitions,
            pagination: { currentPage: page, totalPages, totalRecognitions, limit }
        });

    } catch (error) {
        console.error('List Given Recognitions Error:', error);
         if (error instanceof z.ZodError) {
             return NextResponse.json({ message: 'Invalid query parameters', errors: error.flatten().fieldErrors }, { status: 400 });
        }
        if (!await getAuthenticatedUserId()) {
             return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'An error occurred fetching given recognitions' }, { status: 500 });
    }
}
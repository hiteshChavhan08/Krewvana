// app/api/workshops/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const querySchema = z.object({
    upcomingOnly: z.coerce.boolean().optional().default(true), // Default to show only upcoming
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

        const { upcomingOnly, page, limit } = validation.data;
        const skip = (page - 1) * limit;

        const whereClause: Prisma.WorkshopWhereInput = {};
        if (upcomingOnly) {
            whereClause.startTime = { gte: new Date() }; // Filter for workshops starting now or later
        }

        const workshops = await prisma.workshop.findMany({
            where: whereClause,
            skip: skip,
            take: limit,
            orderBy: { startTime: 'asc' }, // Order by upcoming first
             select: { // Select relevant fields for listing
                id: true,
                title: true,
                description: true,
                startTime: true,
                endTime: true,
                location: true,
                presenter: true,
            }
        });

        const totalWorkshops = await prisma.workshop.count({ where: whereClause });
        const totalPages = Math.ceil(totalWorkshops / limit);

        return NextResponse.json({
            data: workshops,
            pagination: { currentPage: page, totalPages, totalWorkshops, limit }
        });

    } catch (error) {
        console.error('List Workshops Error:', error);
         if (error instanceof z.ZodError) {
             return NextResponse.json({ message: 'Invalid query parameters', errors: error.flatten().fieldErrors }, { status: 400 });
        }
        return NextResponse.json({ message: 'An error occurred listing workshops' }, { status: 500 });
    }
}
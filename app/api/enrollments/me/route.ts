// app/api/enrollments/me/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getAuthenticatedUserId } from '@/lib/session';
import { Prisma } from '@prisma/client';

const querySchema = z.object({
    status: z.string().optional(), // Optional: Filter by status (e.g., "In Progress", "Completed")
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

        const { status, page, limit } = validation.data;
        const skip = (page - 1) * limit;

        const whereClause: Prisma.EnrollmentWhereInput = {
            userId: userId, // Filter by the authenticated user
        };
        if (status) {
            whereClause.status = status;
        }

        const enrollments = await prisma.enrollment.findMany({
            where: whereClause,
            include: { // Include details of the enrolled course
                course: {
                    select: {
                        id: true,
                        title: true,
                        imageUrl: true,
                        difficulty: true,
                        tags: true,
                    }
                }
            },
            skip: skip,
            take: limit,
            orderBy: { createdAt: 'desc' }, // Or orderBy: { course: { title: 'asc' } }
        });

        const totalEnrollments = await prisma.enrollment.count({ where: whereClause });
        const totalPages = Math.ceil(totalEnrollments / limit);

        return NextResponse.json({
            data: enrollments,
            pagination: { currentPage: page, totalPages, totalEnrollments, limit }
        });

    } catch (error) {
        console.error('List My Enrollments Error:', error);
         if (error instanceof z.ZodError) {
             return NextResponse.json({ message: 'Invalid query parameters', errors: error.flatten().fieldErrors }, { status: 400 });
        }
         if (!await getAuthenticatedUserId()) {
             return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'An error occurred fetching your enrollments' }, { status: 500 });
    }
}
// app/api/courses/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const querySchema = z.object({
    search: z.string().optional(),
    tags: z.preprocess((val) => typeof val === 'string' ? val.split(',') : val, z.array(z.string()).optional()), // Allow comma-separated tags
    difficulty: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12), // Sensible limit
});

export async function GET(request: NextRequest) {
    try {
        const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
        const validation = querySchema.safeParse(queryParams);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid query parameters', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        const { search, tags, difficulty, page, limit } = validation.data;
        const skip = (page - 1) * limit;

        const whereClause: Prisma.CourseWhereInput = { AND: [] };

        if (search) {
            (whereClause.AND as Prisma.CourseWhereInput[]).push({
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ]
            });
        }
        if (tags && tags.length > 0) {
            // Assumes 'tags' field in Prisma is String[]
            (whereClause.AND as Prisma.CourseWhereInput[]).push({ tags: { hasSome: tags } });
        }
        if (difficulty) {
            (whereClause.AND as Prisma.CourseWhereInput[]).push({ difficulty: { equals: difficulty, mode: 'insensitive' } });
        }

        if ((whereClause.AND as Prisma.CourseWhereInput[]).length === 0) {
            delete whereClause.AND; // Remove empty AND
        }

        const courses = await prisma.course.findMany({
            where: whereClause,
            skip: skip,
            take: limit,
            orderBy: { createdAt: 'desc' }, // Example order
            select: { // Select fields suitable for a listing view
                id: true,
                title: true,
                description: true, // Maybe truncate later?
                imageUrl: true,
                difficulty: true,
                tags: true,
                source: true,
            }
        });

        const totalCourses = await prisma.course.count({ where: whereClause });
        const totalPages = Math.ceil(totalCourses / limit);

        return NextResponse.json({
            data: courses,
            pagination: { currentPage: page, totalPages, totalCourses, limit }
        });

    } catch (error) {
        console.error('List Courses Error:', error);
        if (error instanceof z.ZodError) { // Should be caught by validation check, but good practice
             return NextResponse.json({ message: 'Invalid query parameters', errors: error.flatten().fieldErrors }, { status: 400 });
        }
        return NextResponse.json({ message: 'An error occurred listing courses' }, { status: 500 });
    }
}
// app/api/courses/[courseId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

type RouteParams = { params: { courseId: string } };

const paramsSchema = z.object({
    courseId: z.string().cuid({ message: "Invalid course ID format" })
});

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const validation = paramsSchema.safeParse(params);
        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid course ID format', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }
        const { courseId } = validation.data;

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            // Select all relevant fields for the detail view
            // You might want to include related data counts if needed
        });

        if (!course) {
            return NextResponse.json({ message: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json(course);

    } catch (error) {
        console.error('Get Course Detail Error:', error);
        if (error instanceof z.ZodError) {
             return NextResponse.json({ message: 'Invalid course ID format', errors: error.flatten().fieldErrors }, { status: 400 });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
            // Handle cases where the ID format is invalid despite Zod CUID check (unlikely but possible)
             return NextResponse.json({ message: 'Invalid course ID format provided.' }, { status: 400 });
        }
        // findUniqueOrThrow throws P2025 if not found, but we handle manually above
        return NextResponse.json({ message: 'An error occurred fetching course details' }, { status: 500 });
    }
}
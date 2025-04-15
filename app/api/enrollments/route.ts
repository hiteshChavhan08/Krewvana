// app/api/enrollments/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getAuthenticatedUserId } from '@/lib/session'; // Your NextAuth helper
import { Prisma } from '@prisma/client';

const enrollSchema = z.object({
    courseId: z.string().cuid({ message: "Invalid course ID format" }),
});

export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validation = enrollSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }
        const { courseId } = validation.data;

        // 1. Check if course exists (optional but good practice)
        const courseExists = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true } // Only select necessary field
        });
        if (!courseExists) {
             return NextResponse.json({ message: 'Course not found' }, { status: 404 });
        }

        // 2. Attempt to create the enrollment (Prisma handles unique constraint)
        const newEnrollment = await prisma.enrollment.create({
            data: {
                userId: userId,
                courseId: courseId,
                status: 'Not Started', // Default status
                progress: 0,          // Default progress
            },
             select: { // Select fields to return
                id: true,
                userId: true,
                courseId: true,
                status: true,
                progress: true,
                createdAt: true,
                // Include course title for immediate feedback if needed
                // course: { select: { title: true } }
             }
        });

        return NextResponse.json(newEnrollment, { status: 201 }); // 201 Created

    } catch (error) {
        console.error('Enrollment Error:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Check for unique constraint violation (user already enrolled)
            if (error.code === 'P2002') {
                // Prisma uses target field names in the meta property
                if (error.meta && (error.meta as any).target?.includes('userId') && (error.meta as any).target?.includes('courseId')) {
                     return NextResponse.json({ message: 'You are already enrolled in this course' }, { status: 409 }); // Conflict
                }
            }
             // Handle foreign key constraint fail if course check was skipped
            if (error.code === 'P2003' && error.meta && (error.meta as any).field_name?.includes('courseId')) {
                 return NextResponse.json({ message: 'Course not found.' }, { status: 404 });
            }
        }
         if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid input', errors: error.flatten().fieldErrors }, { status: 400 });
         }
        if (error instanceof SyntaxError) { // JSON parsing error
            return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
        }
        if (!await getAuthenticatedUserId()) { // Double-check auth status
             return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({ message: 'An error occurred during enrollment' }, { status: 500 });
    }
}
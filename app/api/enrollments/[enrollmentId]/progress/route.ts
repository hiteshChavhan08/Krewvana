// app/api/enrollments/[enrollmentId]/progress/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getAuthenticatedUserId } from '@/lib/session';
import { Prisma } from '@prisma/client';

type RouteParams = { params: { enrollmentId: string } };

const paramsSchema = z.object({
    enrollmentId: z.string().cuid({ message: "Invalid enrollment ID format" })
});

// Define allowed statuses if you want strict control
// const allowedStatuses = ["Not Started", "In Progress", "Completed"] as const;

const updateProgressSchema = z.object({
    // status: z.enum(allowedStatuses).optional(),
    status: z.string().optional(), // Use string if statuses are flexible
    progress: z.coerce.number().int().min(0).max(100).optional(), // Progress percentage 0-100
}).refine(data => data.status !== undefined || data.progress !== undefined, {
    message: "Either status or progress must be provided", // Ensure at least one field is updated
});


export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const paramsValidation = paramsSchema.safeParse(params);
        if (!paramsValidation.success) {
            return NextResponse.json({ message: 'Invalid enrollment ID format', errors: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
        }
        const { enrollmentId } = paramsValidation.data;

        const body = await request.json();
        const bodyValidation = updateProgressSchema.safeParse(body);

        if (!bodyValidation.success) {
            return NextResponse.json({ message: 'Invalid input', errors: bodyValidation.error.flatten().fieldErrors }, { status: 400 });
        }
        const updateData = bodyValidation.data;


        // 1. Find the enrollment
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            select: { userId: true } // Only need userId for authorization check
        });

        if (!enrollment) {
            return NextResponse.json({ message: 'Enrollment not found' }, { status: 404 });
        }

        // 2. Authorization: Check if the logged-in user owns this enrollment
        if (enrollment.userId !== userId) {
            console.warn(`User ${userId} attempted to update progress for enrollment ${enrollmentId} owned by ${enrollment.userId}`);
            return NextResponse.json({ message: 'Forbidden: You do not own this enrollment' }, { status: 403 });
        }

        // 3. Prepare data for update (including setting completedAt if status changes to Completed)
        const dataToUpdate: Prisma.EnrollmentUpdateInput = { ...updateData };
        if (updateData.status === 'Completed' && updateData.progress === undefined) {
             // If status is set to completed, automatically set progress to 100 if not provided
             dataToUpdate.progress = 100;
        }
        if ((updateData.status === 'Completed' || updateData.progress === 100)) {
             dataToUpdate.completedAt = new Date(); // Set completion timestamp
        } else if (updateData.status && updateData.status !== 'Completed') {
            // If status changes *away* from completed, clear completedAt (optional logic)
            dataToUpdate.completedAt = null;
        }


        // 4. Update the enrollment
        const updatedEnrollment = await prisma.enrollment.update({
            where: { id: enrollmentId },
            data: dataToUpdate,
             select: { // Return the updated record
                id: true,
                userId: true,
                courseId: true,
                status: true,
                progress: true,
                updatedAt: true,
                completedAt: true,
            }
        });

        return NextResponse.json(updatedEnrollment); // 200 OK

    } catch (error) {
        console.error('Update Enrollment Progress Error:', error);
         if (error instanceof z.ZodError) { // Handles both param and body validation errors
            return NextResponse.json({ message: 'Invalid input', errors: error.flatten().fieldErrors }, { status: 400 });
         }
         if (error instanceof SyntaxError) {
            return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') { // Record to update not found
                 return NextResponse.json({ message: 'Enrollment not found.' }, { status: 404 });
            }
        }
         if (!await getAuthenticatedUserId()) {
             return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({ message: 'An error occurred updating enrollment progress' }, { status: 500 });
    }
}
// app/api/workshops/[workshopId]/register/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getAuthenticatedUserId } from '@/lib/session';
import { Prisma } from '@prisma/client';

type RouteParams = { params: { workshopId: string } };

const paramsSchema = z.object({
    workshopId: z.string().cuid({ message: "Invalid workshop ID format" })
});

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const validation = paramsSchema.safeParse(params);
        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid workshop ID format', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }
        const { workshopId } = validation.data;


        // 1. Check if workshop exists (optional but recommended)
         const workshopExists = await prisma.workshop.findUnique({
            where: { id: workshopId },
            select: { id: true, startTime: true } // Select startTime if needed for logic (e.g., cannot register for past workshops)
        });
        if (!workshopExists) {
             return NextResponse.json({ message: 'Workshop not found' }, { status: 404 });
        }
        // Optional: Prevent registration for past workshops
        // if (workshopExists.startTime < new Date()) {
        //    return NextResponse.json({ message: 'Cannot register for a past workshop' }, { status: 400 });
        // }


        // 2. Attempt to create the registration (Prisma handles unique constraint)
        const newRegistration = await prisma.workshopRegistration.create({
            data: {
                userId: userId,
                workshopId: workshopId,
            },
            select: { // Select fields to return
                id: true,
                userId: true,
                workshopId: true,
                registeredAt: true,
                // Include workshop title for feedback if desired
                // workshop: { select: { title: true } }
            }
        });

        return NextResponse.json(newRegistration, { status: 201 }); // 201 Created

    } catch (error) {
        console.error('Workshop Registration Error:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Check for unique constraint violation (user already registered)
            if (error.code === 'P2002') {
                 if (error.meta && (error.meta as any).target?.includes('userId') && (error.meta as any).target?.includes('workshopId')) {
                     return NextResponse.json({ message: 'You are already registered for this workshop' }, { status: 409 }); // Conflict
                 }
            }
             // Handle foreign key constraint fail if workshop check was skipped
            if (error.code === 'P2003' && error.meta && (error.meta as any).field_name?.includes('workshopId')) {
                 return NextResponse.json({ message: 'Workshop not found.' }, { status: 404 });
            }
        }
         if (error instanceof z.ZodError) {
             return NextResponse.json({ message: 'Invalid workshop ID format', errors: error.flatten().fieldErrors }, { status: 400 });
         }
         if (!await getAuthenticatedUserId()) {
             return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({ message: 'An error occurred during workshop registration' }, { status: 500 });
    }
}
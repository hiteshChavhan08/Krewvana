// app/api/wellness/mood/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getAuthenticatedUserId } from '@/lib/session';

const moodLogSchema = z.object({
    moodLevel: z.coerce.number().int().min(1, "Mood level must be at least 1").max(5, "Mood level must be at most 5"), // Example scale 1-5
    notes: z.string().max(500, "Notes cannot exceed 500 characters").optional().nullable(),
    date: z.coerce.date({ message: "Invalid date format" }).optional(), // Optional, defaults to now if not provided
});

export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validation = moodLogSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }
        const { moodLevel, notes, date } = validation.data;
        console.log(userId)
        const newMoodLog = await prisma.moodLog.create({
            data: {
                userId: userId,
                moodLevel: moodLevel,
                notes: notes,
                date: date || new Date(), // Use provided date or default to now
            },
            select: { // Return the created log (useful for confirmation)
                id: true,
                userId: true, // Confirm it's the right user
                moodLevel: true,
                notes: true,
                date: true,
            }
        });

        // IMPORTANT: This data is considered private. Do NOT create endpoints to list other users' mood logs.
        // Aggregated, anonymized reporting might be possible but requires careful implementation.

        return NextResponse.json(newMoodLog, { status: 201 }); // 201 Created

    } catch (error) {
        console.error('Log Mood Error:', error);
         if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid input', errors: error.flatten().fieldErrors }, { status: 400 });
         }
         if (error instanceof SyntaxError) {
            return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
        }
         if (!await getAuthenticatedUserId()) {
             return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'An error occurred logging your mood' }, { status: 500 });
    }
}
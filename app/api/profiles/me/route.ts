// app/api/profiles/me/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getAuthenticatedUserId } from '@/lib/session'; // Use our helper
import { Prisma } from '@prisma/client';

// Schema for allowed updatable fields (same as before)
const updateProfileSchema = z.object({
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  jobTitle: z.string().max(100).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  interests: z.array(z.string().max(50)).max(20, "Max 20 interests").optional(),
  skills: z.array(z.string().max(50)).max(50, "Max 50 skills").optional(),
}).strict();

export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(); // Get authenticated user ID

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const updateData = validation.data;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No update data provided' }, { status: 400 });
    }

    // Update the user's profile
    const updatedProfile = await prisma.profile.update({
      where: { userId: userId },
      data: updateData,
      select: { // Return the updated profile fields
        id: true,
        userId: true,
        bio: true,
        department: true,
        jobTitle: true,
        location: true,
        interests: true,
        skills: true,
        points: true,
        updatedAt: true,
      }
    });

    return NextResponse.json(updatedProfile);

  } catch (error) {
    console.error('Update Profile Error:', error);
     if (error instanceof z.ZodError) {
        return NextResponse.json({ message: 'Invalid input', errors: error.flatten().fieldErrors }, { status: 400 });
     }
     if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') { // Record to update not found
         console.error(`Profile update failed: Profile for user ${await getAuthenticatedUserId()} not found.`);
         return NextResponse.json({ message: 'Profile not found for the current user.' }, { status: 404 });
      }
    }
    // Check if userId was null before Prisma call (redundant if handled above, but safe)
    if (!await getAuthenticatedUserId()) {
         return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'An error occurred updating profile' }, { status: 500 });
  }
}
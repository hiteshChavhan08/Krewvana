// app/api/users/[userId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

type RouteParams = { params: { userId: string } };

const paramsSchema = z.object({
  userId: z.string().cuid({ message: "Invalid user ID format" }) // Validate CUID format
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const validation = paramsSchema.safeParse(params);
    if(!validation.success) {
        return NextResponse.json({ message: 'Invalid user ID format', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { userId } = validation.data;

    // Fetch public profile information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { // Select only PUBLIC fields
        id: true,
        name: true,
        image: true,
        createdAt: true,
        profile: {
          select: {
            bio: true,
            department: true,
            jobTitle: true,
            location: true,
            interests: true, // Public? Decide based on privacy needs
            skills: true,    // Public? Decide based on privacy needs
            points: true,    // Public? Decide based on privacy needs
          }
        },
        // Optionally include public counts or relations if desired
        // _count: { select: { ideas: true } }
      }
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Handle potentially missing profile gracefully for public view
    if (!user.profile) {
        console.warn(`User ${userId} viewed publicly is missing a profile.`);
        (user as any).profile = null; // Return null for profile field
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error('Get User Profile Error:', error);
    if (error instanceof z.ZodError) {
        return NextResponse.json({ message: 'Invalid user ID format', errors: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ message: 'An error occurred fetching user profile' }, { status: 500 });
  }
}
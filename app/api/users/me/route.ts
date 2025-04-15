// app/api/users/me/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/session'; // Use our helper

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(); // Get session using NextAuth options

    if (!session?.user?.id) {
      console.log("Unauthorized access attempt to /api/users/me");
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch the logged-in user's data along with their profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            id: true,
            bio: true,
            department: true,
            jobTitle: true,
            location: true,
            interests: true,
            skills: true,
            points: true,
            lastLogin: true,
          }
        },
        // Example: include counts
        // _count: { select: { givenRecognitions: true, receivedRecognitions: true } }
      },
    });

    if (!user) {
      console.error(`Authenticated user ID ${userId} not found in database.`);
      // This indicates a potential issue (session exists but user deleted?)
      return NextResponse.json({ message: 'User associated with session not found' }, { status: 404 });
    }

    // Handle missing profile case if necessary (though registration should create one)
     if (!user.profile) {
        console.warn(`User ${userId} is missing a profile. Creating one.`);
        try {
            const newProfile = await prisma.profile.create({
                data: { userId: userId, points: 0 } // Add defaults as needed
            });
            (user as any).profile = newProfile; // Attach to returned object
        } catch (profileCreateError) {
             console.error(`Failed to create missing profile for user ${userId}:`, profileCreateError);
             // Decide how to handle - return user without profile? Or error?
             (user as any).profile = null; // Indicate profile is missing/failed to create
        }
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error('Get My Profile Error:', error);
    return NextResponse.json({ message: 'An error occurred fetching your profile' }, { status: 500 });
  }
}
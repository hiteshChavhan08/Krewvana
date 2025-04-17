// app/api/users/me/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        points: true,
        createdAt: true, // Optional: for "Member since"
        // --- Include UserBadges and nested Badge details ---
        userBadges: {
          orderBy: { earnedAt: 'desc' }, // Show most recent first
          select: {
            earnedAt: true,
            badge: { // Select fields from the related Badge model
              select: {
                id: true,
                name: true,
                description: true,
                iconName: true, // Get the icon identifier
              },
            },
          },
        },
        // --- End Include ---
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });

  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}
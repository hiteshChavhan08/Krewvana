// app/api/leaderboard/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path if needed
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Extract potential query parameters for pagination/filtering (optional)
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 25; // Default limit 25
  // const period = searchParams.get('period') || 'all_time'; // Future: Add time period filtering

  // Basic validation for limit
  if (isNaN(limit) || limit <= 0) {
    return NextResponse.json({ error: 'Invalid limit parameter' }, { status: 400 });
  }

  try {
    const leaderboard = await prisma.user.findMany({
      // Select only necessary fields for the leaderboard
      select: {
        id: true,
        name: true,
        image: true,
        points: true,
      },
      // Order by points descending
      orderBy: {
        points: 'desc',
      },
      // Limit the number of results
      take: limit,
      // Filter out users with 0 points? (Optional)
      // where: {
      //   points: {
      //     gt: 0,
      //   },
      // },
    });

    // Add rank to the results
    const rankedLeaderboard = leaderboard.map((user, index) => ({
        ...user,
        rank: index + 1, // Add 1-based rank
    }));

    return NextResponse.json(rankedLeaderboard, { status: 200 });

  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
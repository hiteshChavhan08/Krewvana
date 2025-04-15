// --- File: app/api/recognitions/route.ts ---
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// Import authentication logic later (e.g., getServerSession from next-auth)
// import { getServerSession } from "next-auth/next"
// import { authOptions } from "@/app/api/auth/[...nextauth]/route" // Adjust path as needed

// GET handler to fetch recent recognitions
export async function GET(request: Request) {
  try {
    const recognitions = await prisma.recognition.findMany({
      where: {
        isPublic: true, // Only fetch public recognitions for the feed
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20, // Limit the number of recognitions fetched
      include: {
        giver: { // Include giver's name and image
          select: { name: true, image: true },
        },
        recipient: { // Include recipient's name and image
          select: { name: true, image: true },
        },
        badgeAwarded: { // Include badge name if awarded
            select: { name: true, imageUrl: true }
        }
      },
    });
    return NextResponse.json(recognitions);
  } catch (error) {
    console.error("Error fetching recognitions:", error);
    return NextResponse.json(
      { error: 'Failed to fetch recognitions' },
      { status: 500 }
    );
  }
}

// POST handler to create a new recognition
export async function POST(request: Request) {
  // ** IMPORTANT: Add authentication check here! **
  // const session = await getServerSession(authOptions);
  // if (!session?.user?.id) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }
  // const giverId = session.user.id; // Get giverId from session

  // --- TEMPORARY: Remove this when auth is implemented ---
  const tempGiverId = "cl..."; // Replace with a valid User ID from your DB for testing
  if (!tempGiverId) {
     return NextResponse.json({ error: 'Temporary Giver ID not set for testing' }, { status: 400 });
  }
  const giverId = tempGiverId;
  // --- End Temporary ---


  try {
    const body = await request.json();
    const { recipientId, message, valueTag, points, badgeId, isPublic } = body;

    // Basic validation (add more robust validation later)
    if (!recipientId || !message) {
      return NextResponse.json(
        { error: 'Recipient ID and message are required' },
        { status: 400 }
      );
    }

    // TODO: Validate recipientId exists
    // TODO: Validate badgeId exists if provided
    // TODO: Check if giver has enough points to give (if points system involves spending)

    const newRecognition = await prisma.recognition.create({
      data: {
        giverId: giverId, // Use authenticated user ID
        recipientId,
        message,
        valueTag,
        points: points ? parseInt(points, 10) : undefined, // Ensure points is integer
        badgeId,
        isPublic: isPublic !== undefined ? isPublic : true,
      },
       include: { // Return the created object with relations for immediate display
        giver: { select: { name: true, image: true } },
        recipient: { select: { name: true, image: true } },
        badgeAwarded: { select: { name: true, imageUrl: true } }
      },
    });

    // TODO: Award points to recipient if applicable (update Profile)
    // TODO: Create UserBadge entry if badgeId is provided
    // TODO: Create Notification for the recipient

    return NextResponse.json(newRecognition, { status: 201 });

  } catch (error) {
    console.error("Error creating recognition:", error);
    // Check for specific Prisma errors if needed
    return NextResponse.json(
      { error: 'Failed to create recognition' },
      { status: 500 }
    );
  }
}
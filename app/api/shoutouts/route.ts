// app/api/shoutouts/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { ShoutoutCreateSchema } from '@/lib/schemas';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// GET: Fetch shoutouts feed
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  // Add pagination later if needed
  const take = 30;

  try {
    const shoutouts = await prisma.shoutout.findMany({
      take: take,
      orderBy: { createdAt: 'desc' },
      include: {
        submittedBy: { // Who posted it
          select: { id: true, name: true, image: true },
        },
        relatedUser: { // Who is it about (if applicable)
            select: { id: true, name: true, image: true },
        }
      },
    });
    return NextResponse.json(shoutouts);
  } catch (error) {
    console.error("Error fetching shoutouts:", error);
    return NextResponse.json({ error: 'Failed to fetch shoutouts' }, { status: 500 });
  }
}

// POST: Create a new shoutout
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const userId = session.user.id;

  try {
    const json = await request.json();
    // Use safeParse for better error handling potential
    const parseResult = ShoutoutCreateSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Validation failed', details: parseResult.error.errors }, { status: 400 });
    }

    const { type, message, imageUrl, relatedUserId } = parseResult.data;

    // Optional: Validate relatedUserId if provided
    if (relatedUserId) {
        const relatedUserExists = await prisma.user.findUnique({ where: { id: relatedUserId }});
        if (!relatedUserExists) {
            return NextResponse.json({ error: 'Mentioned user not found.' }, { status: 404 });
        }
    }

    const newShoutout = await prisma.shoutout.create({
      data: {
        type: type,
        message: message,
        imageUrl: imageUrl || null, // Store null if empty string
        submittedById: userId,
        relatedUserId: relatedUserId || null, // Store null if empty string
      },
      include: { // Return enriched data
        submittedBy: { select: { id: true, name: true, image: true } },
        relatedUser: { select: { id: true, name: true, image: true } }
      }
    });

    return NextResponse.json(newShoutout, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) { // Should be caught by safeParse now, but good fallback
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error("Error creating shoutout:", error);
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
       // Handle specific Prisma errors if needed (e.g., foreign key constraint)
       return NextResponse.json({ error: 'Database error occurred.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to create shoutout' }, { status: 500 });
  }
}
// app/api/learning/resources/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { LearningResourceCreateSchema } from '@/lib/schemas';
import { ZodError } from 'zod';

// GET: Fetch all learning resources (add pagination later)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  try {
    const resources = await prisma.learningResource.findMany({
      orderBy: { submittedAt: 'desc' },
      include: { submittedBy: { select: { name: true, image: true } } }, // Include submitter info
      // where: { approved: true } // Add filter later if using approval workflow
    });
    return NextResponse.json(resources);
  } catch (error) {
    console.error("Error fetching learning resources:", error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}

// POST: Submit a new learning resource
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const userId = session.user.id;

  try {
    const json = await request.json();
    const data = LearningResourceCreateSchema.parse(json);

    const newResource = await prisma.learningResource.create({
      data: {
        title: data.title,
        url: data.url,
        description: data.description,
        submittedById: userId,
        // approved: false // Set if using approval workflow
      },
    });
    // TODO: Award points for submission later?
    return NextResponse.json(newResource, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error("Error submitting learning resource:", error);
    return NextResponse.json({ error: 'Failed to submit resource' }, { status: 500 });
  }
}
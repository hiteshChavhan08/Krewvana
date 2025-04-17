// app/api/innovation/ideas/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { InnovationIdeaCreateSchema } from '@/lib/schemas';
import { ZodError } from 'zod';

// GET: Fetch all ideas (add pagination later)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  try {
    const ideas = await prisma.innovationIdea.findMany({
      orderBy: { submittedAt: 'desc' },
      include: { submittedBy: { select: { name: true, image: true } } },
      // Add filtering by status later if needed
    });
    return NextResponse.json(ideas);
  } catch (error) {
    console.error("Error fetching innovation ideas:", error);
    return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 });
  }
}

// POST: Submit a new idea
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const userId = session.user.id;

  try {
    const json = await request.json();
    const data = InnovationIdeaCreateSchema.parse(json);

    const newIdea = await prisma.innovationIdea.create({
      data: {
        title: data.title,
        description: data.description,
        submittedById: userId,
        // status: 'Submitted' // If using status field
      },
    });
    // TODO: Award points for submission later?
    return NextResponse.json(newIdea, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error("Error submitting innovation idea:", error);
    return NextResponse.json({ error: 'Failed to submit idea' }, { status: 500 });
  }
}
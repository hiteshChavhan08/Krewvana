// app/api/ideas/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { IdeaCreateSchema } from "@/lib/schemas";
import { ZodError } from "zod";

// GET: Fetch all ideas (with pagination and sorting by votes/date)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const sortBy = searchParams.get("sortBy") || "createdAt"; // 'createdAt' or 'votes'
  const order = searchParams.get("order") || "desc"; // 'asc' or 'desc'
  const skip = (page - 1) * limit;

  try {
    const ideas = await prisma.idea.findMany({
      skip,
      take: limit,
      orderBy:
        sortBy === "votes"
          ? { votes: { _count: order as "asc" | "desc" } } // Order by vote count
          : { [sortBy]: order as "asc" | "desc" }, // Order by other fields like createdAt
      include: {
        submittedBy: { select: { id: true, name: true, image: true } },
        votes: {
          // To check if the current user has voted
          where: { userId: session.user.id },
          select: { id: true },
        },
        _count: {
          // Get the total number of votes for each idea
          select: { votes: true },
        },
      },
    });

    const totalIdeas = await prisma.idea.count();

    // Map ideas to include a simpler 'currentUserVoted' and 'voteCount'
    const processedIdeas = ideas.map((idea) => ({
      ...idea,
      currentUserVoted: idea.votes.length > 0,
      voteCount: idea._count.votes,
      // Remove the full votes array and _count object if not needed directly by client
      // votes: undefined,
      // _count: undefined,
    }));

    return NextResponse.json({
      data: processedIdeas,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalIdeas / limit),
        totalIdeas,
      },
    });
  } catch (error) {
    console.error("Error fetching ideas:", error);
    return NextResponse.json(
      { error: "Failed to fetch ideas" },
      { status: 500 }
    );
  }
}

// POST: Submit a new idea
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const json = await request.json();
    console.log('[API POST /api/ideas] Received JSON body:', JSON.stringify(json, null, 2)); 
    const data = IdeaCreateSchema.parse(json);

    const newIdea = await prisma.idea.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category || [],
        submittedById: userId,
        status: "SUBMITTED",
      },
      include: {
        submittedBy: { select: { id: true, name: true, image: true } },
        _count: { select: { votes: true } }, // Initialize vote count
      },
    });

    // TODO: Award points for submitting an idea (if points system is integrated)
    // e.g., await awardPoints(userId, 'SUBMIT_IDEA', 10);

    return NextResponse.json(
      {
        ...newIdea,
        currentUserVoted: false,
        voteCount: newIdea._count.votes, // Use the actual count from the created object
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error submitting idea:", error);
    return NextResponse.json(
      { error: "Failed to submit idea" },
      { status: 500 }
    );
  }
}

// app/api/ideas/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { IdeaCreateAPISchema } from "@/lib/schemas"; // Use API specific schema
import { ZodError } from "zod";
import { awardPoints } from "@/lib/points";
import { PointLogType } from "@prisma/client";

// GET: Fetch all ideas (with pagination and sorting by votes/date)
export async function GET(request: NextRequest) {
  // Use NextRequest
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const currentUserId = session.user.id;

  let fullUrlString: string;
  try {
    new URL(request.url); // Test if absolute
    fullUrlString = request.url;
  } catch (e) {
    const host = request.headers.get("host");
    const protocol =
      request.headers.get("x-forwarded-proto") ||
      (request.headers.get("referer")?.startsWith("https://")
        ? "https"
        : "http");
    if (!host) {
      console.error("API /api/ideas GET: 'host' header is missing.");
      return NextResponse.json(
        { error: "Internal server configuration error" },
        { status: 500 }
      );
    }
    fullUrlString = `${protocol}://${host}${request.url}`;
  }

  const { searchParams } = new URL(fullUrlString);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const order = searchParams.get("order") || "desc";
  const skip = (page - 1) * limit;

  try {
    const ideas = await prisma.idea.findMany({
      skip,
      take: limit,
      orderBy:
        sortBy === "votes"
          ? { votes: { _count: order as "asc" | "desc" } }
          : { [sortBy]: order as "asc" | "desc" },
      include: {
        submittedBy: { select: { id: true, name: true, image: true } },
        votes: { where: { userId: currentUserId }, select: { id: true } }, // Current user's vote
        _count: { select: { votes: true, comments: true } }, // Include comment count
      },
    });

    const totalIdeas = await prisma.idea.count();

    const processedIdeas = ideas
      .map((idea) => ({
        ...idea,
        currentUserVoted: idea.votes.length > 0,
        voteCount: idea._count.votes,
        commentCount: idea._count.comments, // Add comment count
        // Omitting full votes array and _count object from direct client response
        // votes: undefined, // This actually adds the key with undefined. Better to not spread it.
        // _count: undefined,
      }))
      .map(({ votes, _count, ...rest }) => rest); // Clean way to remove votes and _count

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
export async function POST(request: NextRequest) {
  // Use NextRequest
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const json = await request.json();
    const data = IdeaCreateAPISchema.parse(json); // Use API specific schema

    const newIdea = await prisma.idea.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category || [], // Ensure category is an array
        submittedById: userId,
        status: "SUBMITTED", // Prisma enum IdeaStatus
      },
      include: {
        submittedBy: { select: { id: true, name: true, image: true } },
        _count: { select: { votes: true, comments: true } },
      },
    });
    const responseData = {
      id: newIdea.id,
      title: newIdea.title,
      description: newIdea.description,
      category: newIdea.category,
      status: newIdea.status,
      createdAt: newIdea.createdAt,
      updatedAt: newIdea.updatedAt,
      submittedById: newIdea.submittedById,
      submittedBy: newIdea.submittedBy, // from include
      currentUserVoted: false,
      voteCount: newIdea._count.votes,
      commentCount: newIdea._count.comments,
    };
    return NextResponse.json(responseData, { status: 201 });
    if (newIdea) {
      await awardPoints({
        userId: userId,
        actionType: PointLogType.IDEA_SUBMITTED,
        reason: `Submitted idea: "${newIdea.title.substring(0, 50)}${
          newIdea.title.length > 50 ? "..." : ""
        }"`,
        ideaId: newIdea.id,
      });
    }

    const processedNewIdea = {
      ...newIdea,
      currentUserVoted: false, // New idea, current user hasn't voted
      voteCount: newIdea._count.votes,
      commentCount: newIdea._count.comments,
    };
    // Remove votes and _count from the response like in GET
    const { votes, _count, ...restOfNewIdea } = processedNewIdea;

    return NextResponse.json(restOfNewIdea, { status: 201 });
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

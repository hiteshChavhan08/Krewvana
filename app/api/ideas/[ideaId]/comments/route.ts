// app/api/ideas/[ideaId]/comments/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  IdeaCommentCreateSchema,
  IdeaCommentsQuerySchema,
} from "@/lib/schemas";
import { ZodError } from "zod";

interface RouteContext {
  params: {
    ideaId: string;
  };
}

// POST: Create a new comment for an idea
export async function POST(request: NextRequest, { params }: RouteContext) {
  // Use NextRequest
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { ideaId } = params;

  if (!ideaId) {
    return NextResponse.json({ error: "Idea ID is required" }, { status: 400 });
  }

  try {
    const ideaExists = await prisma.idea.findUnique({
      where: { id: ideaId },
      select: { id: true, submittedById: true },
    });

    if (!ideaExists) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    const json = await request.json();
    const data = IdeaCommentCreateSchema.parse(json);

    const newComment = await prisma.ideaComment.create({
      data: {
        content: data.content,
        authorId: userId,
        ideaId: ideaId,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    });
    // Optional: Add points and notification logic here
    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error(`[API /api/ideas/${ideaId}/comments POST] Error:`, error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

// GET: Fetch comments for an idea (with pagination)
export async function GET(request: NextRequest, { params }: RouteContext) {
  // Use NextRequest
  const { ideaId } = params;
  if (!ideaId) {
    return NextResponse.json({ error: "Idea ID is required" }, { status: 400 });
  }

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
      console.error(
        `API /api/ideas/${ideaId}/comments GET: 'host' header is missing.`
      );
      return NextResponse.json(
        { error: "Internal server configuration error" },
        { status: 500 }
      );
    }
    fullUrlString = `${protocol}://${host}${request.url}`;
  }
  const { searchParams } = new URL(fullUrlString);

  try {
    const ideaExists = await prisma.idea.findUnique({
      where: { id: ideaId },
      select: { id: true },
    });
    if (!ideaExists) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    const queryParams = IdeaCommentsQuerySchema.parse(
      Object.fromEntries(searchParams)
    );
    const { page, limit, sortBy, order } = queryParams;
    const skip = (page - 1) * limit;

    const comments = await prisma.ideaComment.findMany({
      where: { ideaId: ideaId },
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    const totalComments = await prisma.ideaComment.count({
      where: { ideaId: ideaId },
    });

    return NextResponse.json({
      data: comments,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalComments / limit),
        totalItems: totalComments,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      );
    }
    console.error(`[API /api/ideas/${ideaId}/comments GET] Error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

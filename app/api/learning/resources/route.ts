// app/api/learning/resources/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Corrected import path
import prisma from "@/lib/prisma";
import { LearningResourceCreateSchema } from "@/lib/schemas";
import { ZodError } from "zod";

// GET: Fetch all learning resources with pagination
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  try {
    const resources = await prisma.learningResource.findMany({
      skip,
      take: limit,
      orderBy: { submittedAt: "desc" },
      include: {
        submittedBy: { select: { name: true, image: true, id: true } },
      },
      // where: { approved: true } // Add filter later if using approval workflow
    });

    const totalResources = await prisma.learningResource.count({
      // where: { approved: true } // Match filter if used
    });

    return NextResponse.json({
      data: resources,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalResources / limit),
        totalResources,
      },
    });
  } catch (error) {
    console.error("Error fetching learning resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

// POST: Submit a new learning resource
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
      include: {
        submittedBy: { select: { name: true, image: true, id: true } },
      },
    });
    // TODO: Award points for submission (e.g., create a PointEarning activity)
    return NextResponse.json(newResource, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error submitting learning resource:", error);
    return NextResponse.json(
      { error: "Failed to submit resource" },
      { status: 500 }
    );
  }
}

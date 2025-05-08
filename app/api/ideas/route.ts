// app/api/ideas/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { IdeaCreateAPISchema } from "@/lib/schemas";
import { ZodError } from "zod";
import { ideaService } from "@/services/ideaService"; // Import the service

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let fullUrlString: string;
  try {
    new URL(request.url);
    fullUrlString = request.url;
  } catch (e) {
    const host = request.headers.get("host");
    const protocol =
      request.headers.get("x-forwarded-proto") ||
      (request.headers.get("referer")?.startsWith("https://")
        ? "https"
        : "http");
    if (!host) {
      return NextResponse.json(
        { error: "Internal server configuration error (missing host)" },
        { status: 500 }
      );
    }
    fullUrlString = `${protocol}://${host}${request.url}`;
  }
  const { searchParams } = new URL(fullUrlString);

  const query = {
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
    sortBy: searchParams.get("sortBy") || "createdAt",
    order: searchParams.get("order") || "desc",
  };

  try {
    const result = await ideaService.getAllIdeas(query, session.user.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API GET /api/ideas] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch ideas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const data = IdeaCreateAPISchema.parse(json);
    const newIdea = await ideaService.createIdea(data, session.user.id);
    return NextResponse.json(newIdea, { status: 201 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[API POST /api/ideas] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit idea" },
      { status: 500 }
    );
  }
}

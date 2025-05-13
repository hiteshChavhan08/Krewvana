// app/api/ideas/[ideaId]/comments/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  IdeaCommentCreateSchema,
  IdeaCommentsQuerySchema,
} from "@/lib/schemas";
import { ZodError } from "zod";
import { ideaService } from "@/services/ideaService";
// Import the specific response types
import {
  CreateIdeaCommentServiceResponse,
  GetIdeaCommentsServiceResponse,
} from "@/types/serviceTypes";

interface RouteContext {
  params: { ideaId: string };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { ideaId } = await params;
  try {
    const json = await request.json();
    const data = IdeaCommentCreateSchema.parse(json);
    // Add type annotation to help TS
    const result: CreateIdeaCommentServiceResponse =
      await ideaService.createIdeaComment(ideaId, data, session.user.id);

    if (!result.success) {
      // Now TS knows result is ServiceErrorResponse inside this block
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }
    // Outside the block, TS knows result is the success type
    return NextResponse.json(result.data, { status: result.status });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error(
      `[API POST /api/ideas/${params.ideaId}/comments] Error:`,
      error
    );
    return NextResponse.json(
      { error: error.message || "Failed to create comment" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { ideaId } = await params;
  if (!ideaId) {
    return NextResponse.json({ error: "Idea ID is required" }, { status: 400 });
  }

  // URL Parsing logic...
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

  try {
    const queryData = IdeaCommentsQuerySchema.parse(
      Object.fromEntries(searchParams)
    );
    // Add type annotation
    const result: GetIdeaCommentsServiceResponse =
      await ideaService.getIdeaComments(ideaId, queryData);

    if (!result.success) {
      // TS knows result is ServiceErrorResponse
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }
    // TS knows result is PaginatedServiceSuccessResponse<IdeaCommentPayload>
    return NextResponse.json(
      { data: result.data, pagination: result.pagination },
      { status: result.status }
    );
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      );
    }
    console.error(`[API GET /api/ideas/${ideaId}/comments] Error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

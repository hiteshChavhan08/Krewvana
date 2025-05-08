// app/api/ideas/[ideaId]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { IdeaUpdateAPISchema } from "@/lib/schemas";
import { ZodError } from "zod";
import { ideaService } from "@/services/ideaService";
// Import specific response types
import {
  GetIdeaByIdServiceResponse,
  UpdateIdeaServiceResponse,
  DeleteIdeaServiceResponse,
} from "@/types/serviceTypes";

interface RouteContext {
  params: { ideaId: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;
  const { ideaId } = await params;
  try {
    const result: GetIdeaByIdServiceResponse = await ideaService.getIdeaById(
      ideaId,
      currentUserId
    );

    if (!result.success) {
      // Service layer handles internal errors, returns error response
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    // Handle case where idea is not found (service returns success: true, data: null)
    if (result.data === null) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // result is now { success: true, data: IdeaWithCountsAndVoteStatus, status: 200 }
    return NextResponse.json(result.data, { status: result.status });
  } catch (error: any) {
    console.error(`[API GET /api/ideas/${ideaId}] Error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch idea" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { ideaId } = await params;
  try {
    const json = await request.json();
    const data = IdeaUpdateAPISchema.parse(json);
    const result: UpdateIdeaServiceResponse = await ideaService.updateIdea(
      ideaId,
      data,
      session.user.id,
      session.user.role
    );

    if (!result.success) {
      // Handles not found, forbidden, validation error from service refine, or internal error
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }
    // result is { success: true, data: IdeaWithCountsAndVoteStatus, status: 200 }
    return NextResponse.json(result.data, { status: result.status });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error(`[API PUT /api/ideas/${ideaId}] Error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to update idea" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { ideaId } = await params;
  try {
    const result: DeleteIdeaServiceResponse = await ideaService.deleteIdea(
      ideaId,
      session.user.id,
      session.user.role
    );

    if (!result.success) {
      // Handles not found, forbidden, or internal error
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }
    // result is { success: true, data: { message: string }, status: 200 }
    // The error "Property 'message' does not exist on type 'DeleteIdeaServiceResponse'"
    // was likely because TS didn't narrow the type correctly *inside* the success block previously.
    // It should now know 'result' is the success type here.
    return NextResponse.json(result.data, { status: result.status }); // Return { message: "..." }
  } catch (error: any) {
    console.error(`[API DELETE /api/ideas/${ideaId}] Error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to delete idea" },
      { status: 500 }
    );
  }
}

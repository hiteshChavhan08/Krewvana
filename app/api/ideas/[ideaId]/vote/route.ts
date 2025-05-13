// app/api/ideas/[ideaId]/vote/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ideaService } from "@/services/ideaService";
import { VoteOnIdeaServiceResponse } from "@/types/serviceTypes"; // Import specific type

interface RouteContext { params: { ideaId: string } }

export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result: VoteOnIdeaServiceResponse = await ideaService.voteOnIdea(params.ideaId, session.user.id);

    if (!result.success) {
        // Handles idea not found or internal error
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    // result is { success: true, data: { message: string, ... }, status: 200 }
    return NextResponse.json(result.data, { status: result.status });
  } catch (error: any) {
    console.error(`[API VOTE /api/ideas/${params.ideaId}/vote] Error:`, error);
    return NextResponse.json({ error: "Failed to process vote" }, { status: 500 });
  }
}
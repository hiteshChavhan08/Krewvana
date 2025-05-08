// app/api/ideas/[ideaId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { IdeaCreateAPISchema, IdeaFormUpdateValidationSchema } from "@/lib/schemas"; // Assuming IdeaUpdateSchema will be created
import { UserRole, PointLogType } from "@prisma/client"; // For RBAC and points
import { ZodError } from "zod";
// import { deductPointsForIdeaDeletion } from '@/lib/points'; // A new utility if needed

interface RouteContext {
  params: {
    ideaId: string;
  };
}

// GET handler (as previously defined)
export async function GET(request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;
  const { ideaId } = params;

  if (!ideaId) {
    return NextResponse.json({ error: "Idea ID is required" }, { status: 400 });
  }
  try {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: {
        submittedBy: { select: { id: true, name: true, image: true } },
        votes: currentUserId
          ? { where: { userId: currentUserId }, select: { id: true } }
          : false,
        _count: { select: { votes: true, comments: true } },
      },
    });
    if (!idea)
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    const processedIdea = {
      ...idea,
      currentUserVoted: currentUserId ? idea.votes.length > 0 : false,
      voteCount: idea._count.votes,
      commentCount: idea._count.comments,
    };
    return NextResponse.json(processedIdea);
  } catch (error) {
    console.error(`Error fetching idea ${ideaId}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch idea details" },
      { status: 500 }
    );
  }
}

// PUT: Update an existing idea
export async function PUT(request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const currentUserId = session.user.id;
  const currentUserRole = session.user.role; // Assuming role is on session.user

  const { ideaId } = params;
  if (!ideaId) {
    return NextResponse.json({ error: "Idea ID is required" }, { status: 400 });
  }

  try {
    const ideaToUpdate = await prisma.idea.findUnique({
      where: { id: ideaId },
      select: { submittedById: true, status: true }, // Select only necessary fields for auth check
    });

    if (!ideaToUpdate) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // Authorization: Allow edit if user is author OR is an admin
    if (
      ideaToUpdate.submittedById !== currentUserId &&
      currentUserRole !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to edit this idea." },
        { status: 403 }
      );
    }

    // Admins might have fewer restrictions on what they can edit (e.g., status)
    // Authors might only be able to edit title, description, category if status is SUBMITTED/UNDER_REVIEW
    // For simplicity here, we'll use a general IdeaUpdateSchema
    // You might create different Zod schemas for user edits vs admin edits

    const json = await request.json();
    const data = IdeaFormUpdateValidationSchema.parse(json); // You'll need to define IdeaUpdateSchema

    const updatedIdea = await prisma.idea.update({
      where: { id: ideaId },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        status:
          currentUserRole === UserRole.ADMIN && data.status
            ? data.status
            : undefined, // Only admin can change status via this general update
        // updatedAt will be automatically handled by Prisma @updatedAt
      },
      include: {
        // Return the same structure as GET /api/ideas/[ideaId] for consistency
        submittedBy: { select: { id: true, name: true, image: true } },
        votes: { where: { userId: currentUserId }, select: { id: true } },
        _count: { select: { votes: true, comments: true } },
      },
    });

    const processedIdea = {
      ...updatedIdea,
      currentUserVoted: updatedIdea.votes.length > 0,
      voteCount: updatedIdea._count.votes,
      commentCount: updatedIdea._count.comments,
    };

    return NextResponse.json(processedIdea);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error(`Error updating idea ${ideaId}:`, error);
    return NextResponse.json(
      { error: "Failed to update idea" },
      { status: 500 }
    );
  }
}

// DELETE: Delete an idea
export async function DELETE(request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const currentUserId = session.user.id;
  const currentUserRole = session.user.role;

  const { ideaId } = params;
  if (!ideaId) {
    return NextResponse.json({ error: "Idea ID is required" }, { status: 400 });
  }

  try {
    const ideaToDelete = await prisma.idea.findUnique({
      where: { id: ideaId },
      select: { submittedById: true, title: true }, // Select for auth check and potentially for point deduction logic
    });

    if (!ideaToDelete) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // Authorization: Allow delete if user is author OR is an admin
    if (
      ideaToDelete.submittedById !== currentUserId &&
      currentUserRole !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to delete this idea." },
        { status: 403 }
      );
    }

    // --- Point Deduction Logic (Complex - handle carefully) ---
    // If an idea is deleted, what happens to points?
    // 1. Points for IDEA_SUBMITTED (to author): Might need to be reversed.
    // 2. Points for IDEA_VOTE_RECEIVED (to author for each vote): Votes will be cascade deleted.
    //    The PointLog entries linked to these votes via `relatedIdeaVoteId` will have that field set to null.
    //    You might need a more robust way to identify and reverse these if strict point reversal is needed.
    //
    // Example (simple reversal for submission - needs a robust 'deductPoints' or 'reversePoints' utility):
    // if (ideaToDelete.submittedById) {
    //   await deductPointsForIdeaDeletion(ideaToDelete.id, ideaToDelete.submittedById, ideaToDelete.title);
    // }
    // For now, we'll focus on deletion. Point reversal can be a separate enhancement.

    await prisma.idea.delete({
      where: { id: ideaId },
    });
    // Note: IdeaVotes and IdeaComments will be cascade deleted due to schema relations.
    // PointLog entries linked to these will have their foreign keys (relatedIdeaVoteId, relatedIdeaCommentId) set to null.

    return NextResponse.json(
      { message: "Idea deleted successfully" },
      { status: 200 }
    ); // Or 204 No Content
  } catch (error) {
    console.error(`Error deleting idea ${ideaId}:`, error);
    return NextResponse.json(
      { error: "Failed to delete idea" },
      { status: 500 }
    );
  }
}

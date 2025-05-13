// app/api/comments/[commentId]/route.ts

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma'; // Adjust path as needed
import { getCurrentUser } from '@/lib/auth'; // Adjust path and function name as needed

// Schema for validating PATCH request body
const patchCommentSchema = z.object({
  content: z.string().min(1, { message: 'Comment cannot be empty.' }).max(2000, { message: 'Comment is too long.' }), // Adjust max length
});

// --- PATCH Handler: Update a specific comment ---
export async function PATCH(
  request: Request,
  { params }: { params: { commentId: string } }
) {
  const { commentId } = params;

  // 1. Check Authentication
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  // 2. Validate Comment ID
  if (!commentId) {
    return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
  }

  // 3. Parse and Validate Request Body
  let validatedData;
  try {
    const body = await request.json();
    validatedData = patchCommentSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    // 4. Find the comment and check ownership
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // 5. Authorization Check: Only author can edit
    if (comment.authorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden. You cannot edit this comment.' }, { status: 403 });
    }

    // 6. Update the Comment
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: validatedData.content,
        // updatedAt is handled automatically by Prisma @updatedAt
      },
       include: { // Include author details in the response
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      }
    });

    return NextResponse.json(updatedComment);

  } catch (error) {
    console.error(`Error updating comment ${commentId}:`, error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}


// --- DELETE Handler: Delete a specific comment ---
export async function DELETE(
  request: Request, // Not used directly, but part of the signature
  { params }: { params: { commentId: string } }
) {
  const { commentId } = params;

  // 1. Check Authentication
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  // 2. Validate Comment ID
  if (!commentId) {
    return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
  }

  try {
    // 3. Find the comment and check ownership/permissions
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
       // Select authorId and potentially related answer/question author IDs if mods can delete
      select: { authorId: true, answer: { select: { question: { select: { authorId: true } } } } }
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // 4. Authorization Check: Author or maybe Admin or Question Author?
    // Example: Allow author or admin to delete
    const canDelete = comment.authorId === user.id || user.role === 'ADMIN'; // Assuming User model has 'role'

    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden. You cannot delete this comment.' }, { status: 403 });
    }

    // 5. Delete the Comment (and related notifications via cascade if set up)
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return new NextResponse(null, { status: 204 }); // 204 No Content

  } catch (error) {
    console.error(`Error deleting comment ${commentId}:`, error);
    // Handle potential Prisma errors (e.g., record not found if already deleted)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
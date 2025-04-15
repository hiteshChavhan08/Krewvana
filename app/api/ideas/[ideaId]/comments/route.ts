// app/api/ideas/[ideaId]/comments/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getAuthenticatedUserId } from '@/lib/session';

type RouteParams = { params: { ideaId: string } };

const paramsSchema = z.object({
    ideaId: z.string().cuid({ message: "Invalid idea ID format" })
});

const commentSchema = z.object({
    text: z.string().min(1, "Comment cannot be empty").max(2000), // Set reasonable limits
});

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const paramsValidation = paramsSchema.safeParse(params);
        if (!paramsValidation.success) {
            return NextResponse.json({ message: 'Invalid idea ID format', errors: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
        }
        const { ideaId } = paramsValidation.data;

        const body = await request.json();
        const bodyValidation = commentSchema.safeParse(body);
        if (!bodyValidation.success) {
            return NextResponse.json({ message: 'Invalid input', errors: bodyValidation.error.flatten().fieldErrors }, { status: 400 });
        }
        const { text } = bodyValidation.data;

        // Check if idea exists (optional, handled by foreign key constraint)
        const ideaExists = await prisma.idea.findUnique({ where: { id: ideaId }, select: { id: true }});
        if (!ideaExists) {
             return NextResponse.json({ message: 'Idea not found' }, { status: 404 });
        }

        // Create the comment
        const newComment = await prisma.comment.create({
            data: {
                text: text,
                ideaId: ideaId, // Link to the idea
                authorId: userId, // Link to the logged-in user
                // postId should be null if commenting on an idea
            },
            include: { // Include author details in the response
                author: {
                    select: { id: true, name: true, image: true }
                }
            }
        });

        // Optional: Trigger notification to idea author?

        return NextResponse.json(newComment, { status: 201 }); // 201 Created

    } catch (error) {
        console.error('Add Comment Error:', error);
         if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid input', errors: error.flatten().fieldErrors }, { status: 400 });
         }
         if (error instanceof SyntaxError) {
            return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
        }
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
             if (error.code === 'P2003') { // Foreign key constraint failed
                 // Could be ideaId or authorId, but ideaId is more likely checked/validated here
                 return NextResponse.json({ message: 'Idea not found.' }, { status: 404 });
            }
         }
         if (!await getAuthenticatedUserId()) {
             return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'An error occurred while adding the comment' }, { status: 500 });
    }
}
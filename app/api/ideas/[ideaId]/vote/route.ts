// app/api/ideas/[ideaId]/vote/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { VoteType, Prisma } from '@prisma/client'; // Import VoteType enum
import { getAuthenticatedUserId } from '@/lib/session';

type RouteParams = { params: { ideaId: string } };

const paramsSchema = z.object({
    ideaId: z.string().cuid({ message: "Invalid idea ID format" })
});

const voteSchema = z.object({
    type: z.nativeEnum(VoteType), // Use the Prisma enum for validation
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
        const bodyValidation = voteSchema.safeParse(body);
        if (!bodyValidation.success) {
            return NextResponse.json({ message: 'Invalid input', errors: bodyValidation.error.flatten().fieldErrors }, { status: 400 });
        }
        const { type } = bodyValidation.data;

        // Check if idea exists (optional, handled by foreign key constraint, but good practice)
        const ideaExists = await prisma.idea.findUnique({ where: { id: ideaId }, select: { id: true }});
        if (!ideaExists) {
             return NextResponse.json({ message: 'Idea not found' }, { status: 404 });
        }

        // Use upsert to create or update the vote
        const vote = await prisma.vote.upsert({
            where: {
                // Use the compound unique key defined in your schema
                ideaId_userId: {
                    ideaId: ideaId,
                    userId: userId,
                }
            },
            update: { // If vote exists, update its type
                type: type,
            },
            create: { // If vote doesn't exist, create it
                ideaId: ideaId,
                userId: userId,
                type: type,
            },
            select: { // Select fields of the resulting vote
                id: true,
                type: true,
                userId: true,
                ideaId: true,
                createdAt: true
            }
        });

        // You might want to return the new vote score of the idea here
        // Requires an additional query after the upsert
        // const updatedVotes = await prisma.vote.findMany({ where: { ideaId }, select: { type: true }});
        // const upVotes = updatedVotes.filter(v => v.type === 'UP').length;
        // const downVotes = updatedVotes.filter(v => v.type === 'DOWN').length;
        // const voteScore = upVotes - downVotes;

        return NextResponse.json({ vote /* , voteScore */ }); // Return created/updated vote

    } catch (error) {
        console.error('Vote Error:', error);
         if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid input', errors: error.flatten().fieldErrors }, { status: 400 });
         }
         if (error instanceof SyntaxError) {
            return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2003: Foreign key constraint failed (ideaId doesn't exist)
             if (error.code === 'P2003') {
                 return NextResponse.json({ message: 'Idea not found.' }, { status: 404 });
            }
        }
        if (!await getAuthenticatedUserId()) {
             return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'An error occurred while voting' }, { status: 500 });
    }
}
// app/api/ideas/[ideaId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

type RouteParams = { params: { ideaId: string } };

const paramsSchema = z.object({
    ideaId: z.string().cuid({ message: "Invalid idea ID format" })
});

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const validation = paramsSchema.safeParse(params);
        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid idea ID format', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }
        const { ideaId } = validation.data;

        const idea = await prisma.idea.findUnique({
            where: { id: ideaId },
            include: {
                author: { // Author details
                    select: { id: true, name: true, image: true }
                },
                votes: { // Include votes to calculate score
                    select: { userId: true, type: true }
                },
                comments: { // Include comments with their authors
                    orderBy: { createdAt: 'asc' }, // Order comments chronologically
                    include: {
                        author: {
                            select: { id: true, name: true, image: true }
                        }
                    }
                },
                // Add challenge submission if needed
                // challengeSubmission: { select: { id: true, challengeId: true } }
            }
        });

        if (!idea) {
            return NextResponse.json({ message: 'Idea not found' }, { status: 404 });
        }

        // Calculate vote score
        const upVotes = idea.votes.filter(v => v.type === 'UP').length;
        const downVotes = idea.votes.filter(v => v.type === 'DOWN').length;
        const voteScore = upVotes - downVotes;

        // Remove detailed votes from response, return only score and counts
        const responseData = {
            ...idea,
            votes: undefined, // Remove the votes array
            voteScore: voteScore,
            upVotes: upVotes,
            downVotes: downVotes,
            totalVotes: idea.votes.length,
            totalComments: idea.comments.length // Add comment count explicitly if needed
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('Get Idea Detail Error:', error);
        if (error instanceof z.ZodError) {
             return NextResponse.json({ message: 'Invalid idea ID format', errors: error.flatten().fieldErrors }, { status: 400 });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
             return NextResponse.json({ message: 'Invalid idea ID format provided.' }, { status: 400 });
        }
        return NextResponse.json({ message: 'An error occurred fetching idea details' }, { status: 500 });
    }
}
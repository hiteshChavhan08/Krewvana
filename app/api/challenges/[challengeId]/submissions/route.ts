// app/api/challenges/[challengeId]/submissions/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getAuthenticatedUserId } from '@/lib/session';

type RouteParams = { params: { challengeId: string } };

const paramsSchema = z.object({
    challengeId: z.string().cuid({ message: "Invalid challenge ID format" })
});

// Allow submission via linked idea OR direct text, but not neither/both
const submissionSchema = z.object({
    teamName: z.string().max(100).optional(),
    ideaId: z.string().cuid({ message: "Invalid idea ID format" }).optional(),
    submissionText: z.string().min(10, "Submission text must be at least 10 characters").max(10000).optional(),
}).refine(data => !!data.ideaId !== !!data.submissionText, { // XOR logic: one must be present, not both
    message: "Submit either an existing Idea ID or Submission Text, not both or neither.",
    path: ["ideaId", "submissionText"], // Associate error with these fields
});

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const paramsValidation = paramsSchema.safeParse(params);
        if (!paramsValidation.success) {
            return NextResponse.json({ message: 'Invalid challenge ID format', errors: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
        }
        const { challengeId } = paramsValidation.data;

        const body = await request.json();
        const bodyValidation = submissionSchema.safeParse(body);
        if (!bodyValidation.success) {
            return NextResponse.json({ message: 'Invalid input', errors: bodyValidation.error.flatten().fieldErrors }, { status: 400 });
        }
        const { teamName, ideaId, submissionText } = bodyValidation.data;


        // 1. Check if challenge exists and is active (important!)
        const challenge = await prisma.innovationChallenge.findUnique({
            where: { id: challengeId },
            select: { id: true, startDate: true, endDate: true }
        });
        if (!challenge) {
             return NextResponse.json({ message: 'Challenge not found' }, { status: 404 });
        }
        const now = new Date();
        if (now < challenge.startDate || now > challenge.endDate) {
             return NextResponse.json({ message: 'Challenge is not currently active for submissions' }, { status: 400 });
        }


        // 2. If ideaId is provided, verify the idea exists and user owns it (optional, depends on rules)
        if (ideaId) {
            const idea = await prisma.idea.findUnique({
                where: { id: ideaId },
                select: { id: true, authorId: true }
            });
            if (!idea) {
                return NextResponse.json({ message: `Idea with ID ${ideaId} not found` }, { status: 404 });
            }
             // Optional: Check if the submitter is the idea author
             // if (idea.authorId !== userId) {
             //     return NextResponse.json({ message: 'You can only submit ideas you created' }, { status: 403 });
             // }

             // Optional: Check if this idea is already submitted to this or another challenge
             const existingSubmission = await prisma.challengeSubmission.findFirst({
                where: { ideaId: ideaId },
                select: { id: true, challengeId: true }
             });
             if(existingSubmission) {
                const conflictingChallengeId = existingSubmission.challengeId;
                return NextResponse.json({ message: `This idea (ID: ${ideaId}) has already been submitted to a challenge (ID: ${conflictingChallengeId}).` }, { status: 409 });
             }
        }


        // 3. Create the submission
        const newSubmission = await prisma.challengeSubmission.create({
            data: {
                challengeId: challengeId,
                submitterId: userId,
                teamName: teamName,
                ideaId: ideaId,             // Will be null if submissionText provided
                submissionText: submissionText, // Will be null if ideaId provided
                submittedAt: new Date(),
                // score and isWinner defaults handled by schema
            },
            select: { // Select fields to return
                id: true,
                challengeId: true,
                submitterId: true,
                teamName: true,
                ideaId: true,
                submissionText: true, // Include text if it exists
                submittedAt: true,
                // Optionally include linked idea title or challenge title
                 idea: ideaId ? { select: { title: true } } : undefined,
                 challenge: { select: { title: true } }
            }
        });

        return NextResponse.json(newSubmission, { status: 201 }); // 201 Created

    } catch (error) {
        console.error('Challenge Submission Error:', error);
         if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid input', errors: error.flatten().fieldErrors }, { status: 400 });
         }
         if (error instanceof SyntaxError) {
            return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             if (error.code === 'P2003') { // Foreign key constraint failed
                 if (error.meta && (error.meta as any).field_name?.includes('challengeId')) {
                    return NextResponse.json({ message: 'Challenge not found.' }, { status: 404 });
                 }
                 if (error.meta && (error.meta as any).field_name?.includes('ideaId')) {
                    return NextResponse.json({ message: 'Idea not found.' }, { status: 404 });
                 }
            }
            // P2002 can happen if ideaId is unique in ChallengeSubmission and submitted twice
            if (error.code === 'P2002' && error.meta && (error.meta as any).target?.includes('ideaId')) {
                 return NextResponse.json({ message: 'This idea has already been submitted to this challenge.' }, { status: 409 });
            }
        }
         if (!await getAuthenticatedUserId()) {
             return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'An error occurred during challenge submission' }, { status: 500 });
    }
}
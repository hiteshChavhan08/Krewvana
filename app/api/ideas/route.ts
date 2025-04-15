// app/api/ideas/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma, VoteType } from '@prisma/client'; // Import VoteType enum
import { getAuthenticatedUserId } from '@/lib/session';

// --- GET Logic ---

const listIdeasQuerySchema = z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    status: z.string().optional(), // e.g., Submitted, Approved, etc.
    sortBy: z.enum(['createdAt_desc', 'createdAt_asc', 'votes_desc', 'comments_desc']).default('createdAt_desc'), // Added sorting options
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

export async function GET(request: NextRequest) {
    try {
        const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
        const validation = listIdeasQuerySchema.safeParse(queryParams);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid query parameters', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        const { search, category, status, sortBy, page, limit } = validation.data;
        const skip = (page - 1) * limit;

        const whereClause: Prisma.IdeaWhereInput = { AND: [] };
        if (search) {
            (whereClause.AND as Prisma.IdeaWhereInput[]).push({
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ]
            });
        }
        if (category) {
            (whereClause.AND as Prisma.IdeaWhereInput[]).push({ category: { equals: category, mode: 'insensitive' } });
        }
        if (status) {
            (whereClause.AND as Prisma.IdeaWhereInput[]).push({ status: { equals: status, mode: 'insensitive' } });
        }
        if ((whereClause.AND as Prisma.IdeaWhereInput[]).length === 0) {
            delete whereClause.AND;
        }

        // Determine orderBy clause
        let orderBy: Prisma.IdeaOrderByWithRelationAndSearchRelevanceInput = {};
        switch (sortBy) {
            case 'createdAt_asc':
                orderBy = { createdAt: 'asc' };
                break;
            case 'votes_desc': // Note: Simple count sorting. True score sorting is more complex.
                orderBy = { votes: { _count: 'desc' } };
                break;
            case 'comments_desc':
                 orderBy = { comments: { _count: 'desc' } };
                 break;
            case 'createdAt_desc':
            default:
                orderBy = { createdAt: 'desc' };
        }

        const ideas = await prisma.idea.findMany({
            where: whereClause,
            skip: skip,
            take: limit,
            orderBy: orderBy,
            include: { // Include author and counts for listing
                author: {
                    select: { id: true, name: true, image: true }
                },
                _count: { // Get counts of votes and comments
                    select: { votes: true, comments: true }
                }
            }
        });

         // Optionally: Calculate vote score (up - down) for each idea if needed
         // This might require fetching votes or doing a more complex aggregation
         const ideasWithVoteScore = ideas.map(idea => ({
             ...idea,
             // Placeholder: Simple count is in _count. Real score needs fetching votes.
             // voteScore: (idea._count.votes) // This is just total votes, not score
         }));

        const totalIdeas = await prisma.idea.count({ where: whereClause });
        const totalPages = Math.ceil(totalIdeas / limit);

        return NextResponse.json({
            data: ideasWithVoteScore, // Return ideas possibly enhanced with score
            pagination: { currentPage: page, totalPages, totalIdeas, limit }
        });

    } catch (error) {
        console.error('List Ideas Error:', error);
         if (error instanceof z.ZodError) {
             return NextResponse.json({ message: 'Invalid query parameters', errors: error.flatten().fieldErrors }, { status: 400 });
        }
        return NextResponse.json({ message: 'An error occurred listing ideas' }, { status: 500 });
    }
}

// --- POST Logic ---

const createIdeaSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(150),
    description: z.string().min(10, "Description must be at least 10 characters").max(5000),
    category: z.string().min(1, "Category is required").max(50).optional().nullable(), // Made optional based on schema, add validation if needed
});

export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validation = createIdeaSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }
        const { title, description, category } = validation.data;

        const newIdea = await prisma.idea.create({
            data: {
                title,
                description,
                category: category ?? 'General', // Provide a default category if null/not provided
                status: 'Submitted', // Default status on creation
                authorId: userId,
            },
            include: { // Include author details in the response
                author: {
                    select: { id: true, name: true, image: true }
                }
            }
        });

        return NextResponse.json(newIdea, { status: 201 }); // 201 Created

    } catch (error) {
        console.error('Create Idea Error:', error);
         if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid input', errors: error.flatten().fieldErrors }, { status: 400 });
         }
         if (error instanceof SyntaxError) {
            return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
         }
        if (!await getAuthenticatedUserId()) {
             return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'An error occurred creating the idea' }, { status: 500 });
    }
}
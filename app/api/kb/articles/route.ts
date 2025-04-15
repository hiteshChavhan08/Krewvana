// app/api/kb/articles/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma, Role } from '@prisma/client'; // Import Role enum if needed for auth check
import { getAuthenticatedUserId, getServerSession } from '@/lib/session';

// --- GET Logic (List KB Articles) ---

const listKbQuerySchema = z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    tags: z.preprocess((val) => typeof val === 'string' ? val.split(',') : val, z.array(z.string()).optional()),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

export async function GET(request: NextRequest) {
    try {
        // KB listing often requires login
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
        const validation = listKbQuerySchema.safeParse(queryParams);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid query parameters', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        const { search, category, tags, page, limit } = validation.data;
        const skip = (page - 1) * limit;

        const whereClause: Prisma.KnowledgeBaseArticleWhereInput = { AND: [] };
        if (search) {
            (whereClause.AND as Prisma.KnowledgeBaseArticleWhereInput[]).push({
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { content: { contains: search, mode: 'insensitive' } }, // Search content? Might be slow.
                    { tags: { has: search } } // Search if tag exactly matches search term
                ]
            });
        }
        if (category) {
             (whereClause.AND as Prisma.KnowledgeBaseArticleWhereInput[]).push({ category: { equals: category, mode: 'insensitive' } });
        }
        if (tags && tags.length > 0) {
             (whereClause.AND as Prisma.KnowledgeBaseArticleWhereInput[]).push({ tags: { hasSome: tags } });
        }
         if ((whereClause.AND as Prisma.KnowledgeBaseArticleWhereInput[]).length === 0) {
            delete whereClause.AND;
        }

        const articles = await prisma.knowledgeBaseArticle.findMany({
            where: whereClause,
            skip: skip,
            take: limit,
            orderBy: { updatedAt: 'desc' }, // Show recently updated first
            select: { // Select fields for list view (exclude full content?)
                id: true,
                title: true,
                slug: true,
                category: true,
                tags: true,
                // authorId: true, // Maybe fetch author name later if needed
                createdAt: true,
                updatedAt: true,
                 // Optionally include snippet of content
                 // content: { take: 100 } // This syntax isn't valid, needs workaround if snippet needed
            }
        });

        const totalArticles = await prisma.knowledgeBaseArticle.count({ where: whereClause });
        const totalPages = Math.ceil(totalArticles / limit);

        return NextResponse.json({
            data: articles,
            pagination: { currentPage: page, totalPages, totalArticles, limit }
        });

    } catch (error) {
        console.error('List KB Articles Error:', error);
         if (error instanceof z.ZodError) {
             return NextResponse.json({ message: 'Invalid query parameters', errors: error.flatten().fieldErrors }, { status: 400 });
        }
         if (!await getAuthenticatedUserId()) { // Re-check auth
             return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'An error occurred listing knowledge base articles' }, { status: 500 });
    }
}

// --- POST Logic (Create KB Article) ---

const createKbSchema = z.object({
    title: z.string().min(3).max(200),
    slug: z.string().min(3).max(250).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { // Basic slug validation
        message: "Slug must contain only lowercase letters, numbers, and hyphens (-)"
    }),
    content: z.string().min(50, "Article content seems too short"), // Require substantial content
    category: z.string().max(50).optional().nullable(),
    tags: z.array(z.string().max(30)).max(10, "Maximum 10 tags allowed").optional(),
});

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(); // Get session to check role
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        // --- Authorization: Check Role ---
        // Only allow ADMIN or MANAGER (example roles) to create KB articles
        const allowedRoles: string[] = [Role.ADMIN, Role.MANAGER]; // Use imported Role enum
        if (!session.user.role || !allowedRoles.includes(session.user.role)) {
             console.warn(`User ${userId} (role: ${session.user.role}) attempted to create KB article without permission.`);
             return NextResponse.json({ message: 'Forbidden: You do not have permission to create knowledge base articles' }, { status: 403 });
        }

        const body = await request.json();
        const validation = createKbSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }
        const { title, slug, content, category, tags } = validation.data;

        // Check for slug uniqueness
        const existingSlug = await prisma.knowledgeBaseArticle.findUnique({
            where: { slug },
            select: { id: true }
        });
        if (existingSlug) {
             return NextResponse.json({ message: `A knowledge base article with the slug "${slug}" already exists.` }, { status: 409 });
        }

        const newArticle = await prisma.knowledgeBaseArticle.create({
            data: {
                title,
                slug,
                content,
                category,
                tags: tags || [], // Ensure tags is an array
                authorId: userId, // Assign the creator as author
            },
            // Select fields to return
             select: {
                 id: true,
                 title: true,
                 slug: true,
                 category: true,
                 tags: true,
                 authorId: true,
                 createdAt: true,
                 updatedAt: true,
             }
        });

        return NextResponse.json(newArticle, { status: 201 }); // 201 Created

    } catch (error) {
        console.error('Create KB Article Error:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
             // Should be caught by explicit slug check, but handle just in case
             return NextResponse.json({ message: 'An article with this slug already exists.' }, { status: 409 });
        }
         if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid input', errors: error.flatten().fieldErrors }, { status: 400 });
         }
         if (error instanceof SyntaxError) {
            return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
        }
        if (!await getAuthenticatedUserId()) {
             return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'An error occurred creating the knowledge base article' }, { status: 500 });
    }
}
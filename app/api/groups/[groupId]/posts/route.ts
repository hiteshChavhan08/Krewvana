// app/api/groups/[groupId]/posts/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getAuthenticatedUserId } from '@/lib/session';

type RouteParams = { params: { groupId: string } };

const paramsSchema = z.object({
    groupId: z.string().cuid({ message: "Invalid group ID format" })
});


// --- Authorization Helper ---
// Checks if user can view/post in the group
async function checkGroupAccess(groupId: string, userId: string | null): Promise<{ allowed: boolean; groupExists: boolean; isMember: boolean; isPublic: boolean }> {
    if (!userId) {
        // Not logged in, check if group exists and is public
        const group = await prisma.group.findUnique({ where: { id: groupId }, select: { isPublic: true }});
        return { allowed: !!group?.isPublic, groupExists: !!group, isMember: false, isPublic: !!group?.isPublic };
    }

    // Logged in, check if group exists and user is member OR group is public
    const groupMembership = await prisma.group.findUnique({
        where: { id: groupId },
        select: {
            isPublic: true,
            members: {
                where: { userId: userId },
                select: { userId: true } // Check if membership record exists
            }
        }
    });

    if (!groupMembership) {
        return { allowed: false, groupExists: false, isMember: false, isPublic: false };
    }

    const isMember = groupMembership.members.length > 0;
    const isPublic = groupMembership.isPublic;
    const allowed = isPublic || isMember;

    return { allowed, groupExists: true, isMember, isPublic };
}


// --- GET Logic (List Posts in Group) ---

const listPostsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const userId = await getAuthenticatedUserId(); // May be null if public groups allowed

        const paramsValidation = paramsSchema.safeParse(params);
        if (!paramsValidation.success) {
            return NextResponse.json({ message: 'Invalid group ID format', errors: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
        }
        const { groupId } = paramsValidation.data;

        // Check if user has access to view posts in this group
        const access = await checkGroupAccess(groupId, userId);
        if (!access.groupExists) {
             return NextResponse.json({ message: 'Group not found' }, { status: 404 });
        }
        if (!access.allowed) {
             // If not allowed, could be because user isn't logged in (for private group) or isn't member
             const status = userId ? 403 : 401; // Forbidden or Unauthorized
             const message = userId ? 'Forbidden: You are not a member of this private group' : 'Unauthorized: Please log in to view this group';
             return NextResponse.json({ message }, { status });
        }

        const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
        const queryValidation = listPostsQuerySchema.safeParse(queryParams);
        if (!queryValidation.success) {
            return NextResponse.json({ message: 'Invalid query parameters', errors: queryValidation.error.flatten().fieldErrors }, { status: 400 });
        }

        const { page, limit } = queryValidation.data;
        const skip = (page - 1) * limit;

        const whereClause: Prisma.PostWhereInput = {
            groupId: groupId,
        };

        const posts = await prisma.post.findMany({
            where: whereClause,
            skip: skip,
            take: limit,
            orderBy: { createdAt: 'desc' }, // Show newest posts first
            include: { // Include author and comment count
                author: {
                    select: { id: true, name: true, image: true }
                },
                _count: {
                    select: { comments: true }
                }
            }
        });

        const totalPosts = await prisma.post.count({ where: whereClause });
        const totalPages = Math.ceil(totalPosts / limit);

        return NextResponse.json({
            data: posts,
            pagination: { currentPage: page, totalPages, totalPosts, limit }
        });

    } catch (error) {
        console.error('List Posts Error:', error);
         if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid query/param format', errors: error.flatten().fieldErrors }, { status: 400 });
         }
        return NextResponse.json({ message: 'An error occurred listing posts' }, { status: 500 });
    }
}

// --- POST Logic (Create Post in Group) ---

const createPostSchema = z.object({
    title: z.string().max(200).optional().nullable(),
    content: z.string().min(1, "Post content cannot be empty").max(20000), // Generous limit
    isAnnouncement: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const paramsValidation = paramsSchema.safeParse(params);
        if (!paramsValidation.success) {
            return NextResponse.json({ message: 'Invalid group ID format', errors: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
        }
        const { groupId } = paramsValidation.data;

        // Check if user has access to POST in this group (must be a member)
        const access = await checkGroupAccess(groupId, userId);
         if (!access.groupExists) {
             return NextResponse.json({ message: 'Group not found' }, { status: 404 });
        }
        // For posting, usually require membership even if public
        if (!access.isMember) {
             // TODO: Could add check for ADMIN/Group ADMIN role later to allow non-members to post announcements
             console.warn(`User ${userId} attempted to post in group ${groupId} without membership.`);
             return NextResponse.json({ message: 'Forbidden: You must be a member to post in this group' }, { status: 403 });
        }

        const body = await request.json();
        const bodyValidation = createPostSchema.safeParse(body);
        if (!bodyValidation.success) {
            return NextResponse.json({ message: 'Invalid input', errors: bodyValidation.error.flatten().fieldErrors }, { status: 400 });
        }
        const { title, content, isAnnouncement } = bodyValidation.data;

        // TODO: If isAnnouncement is true, potentially check if user has ADMIN role in the group

        const newPost = await prisma.post.create({
            data: {
                title,
                content,
                isAnnouncement,
                authorId: userId,
                groupId: groupId, // Link to the group
            },
            include: { // Include author details in response
                author: {
                    select: { id: true, name: true, image: true }
                },
                _count: { // Include initial comment count (0)
                    select: { comments: true }
                }
            }
        });

        // Optional: Trigger notifications to group members?

        return NextResponse.json(newPost, { status: 201 }); // 201 Created

    } catch (error) {
        console.error('Create Post Error:', error);
         if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid input', errors: error.flatten().fieldErrors }, { status: 400 });
         }
         if (error instanceof SyntaxError) {
            return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
        }
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return NextResponse.json({ message: 'Group not found.' }, { status: 404 }); // Foreign key constraint
         }
        if (!await getAuthenticatedUserId()) {
             return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'An error occurred creating the post' }, { status: 500 });
    }
}
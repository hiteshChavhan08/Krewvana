// app/api/groups/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma, GroupType, GroupRole } from '@prisma/client';
import { getAuthenticatedUserId, getServerSession } from '@/lib/session'; // Assuming getServerSession can give full session data including role

// --- GET Logic (List Groups) ---

const listGroupsQuerySchema = z.object({
    search: z.string().optional(),
    type: z.nativeEnum(GroupType).optional(), // Filter by INTEREST, PROJECT, TEAM
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

export async function GET(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId(); // Require login to see groups

        const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
        const validation = listGroupsQuerySchema.safeParse(queryParams);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid query parameters', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        const { search, type, page, limit } = validation.data;
        const skip = (page - 1) * limit;

        // Base filter: Show public groups OR groups the user is a member of
        const membershipFilter: Prisma.GroupWhereInput = userId ? {
            OR: [
                { isPublic: true },
                { members: { some: { userId: userId } } }
            ]
        } : { isPublic: true }; // If not logged in (or userId fails), only show public

        // Combine with search/type filters
        const whereClause: Prisma.GroupWhereInput = {
            AND: [membershipFilter] // Start with the basic visibility filter
        };

        if (search) {
            (whereClause.AND as Prisma.GroupWhereInput[]).push({
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ]
            });
        }
        if (type) {
            (whereClause.AND as Prisma.GroupWhereInput[]).push({ type: type });
        }

        const groups = await prisma.group.findMany({
            where: whereClause,
            skip: skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { // Include member count for display
                _count: {
                    select: { members: true }
                }
            }
        });

        const totalGroups = await prisma.group.count({ where: whereClause });
        const totalPages = Math.ceil(totalGroups / limit);

        return NextResponse.json({
            data: groups,
            pagination: { currentPage: page, totalPages, totalGroups, limit }
        });

    } catch (error) {
        console.error('List Groups Error:', error);
         if (error instanceof z.ZodError) {
             return NextResponse.json({ message: 'Invalid query parameters', errors: error.flatten().fieldErrors }, { status: 400 });
        }
        return NextResponse.json({ message: 'An error occurred listing groups' }, { status: 500 });
    }
}

// --- POST Logic (Create Group) ---

const createGroupSchema = z.object({
    name: z.string().min(3, "Group name must be at least 3 characters").max(100),
    description: z.string().max(500).optional().nullable(),
    type: z.nativeEnum(GroupType), // Require type: INTEREST, PROJECT, TEAM
    isPublic: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validation = createGroupSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }
        const { name, description, type, isPublic } = validation.data;

        // Transaction: Create group and add creator as ADMIN member
        const newGroup = await prisma.$transaction(async (tx) => {
            // 1. Create the Group
            const group = await tx.group.create({
                data: {
                    name,
                    description,
                    type,
                    isPublic,
                }
            });

            // 2. Add the creator as the first member with ADMIN role
            await tx.groupMember.create({
                data: {
                    groupId: group.id,
                    userId: userId,
                    role: GroupRole.ADMIN, // Creator is Admin
                }
            });

            return group; // Return the created group
        });

        // Optionally fetch the full group with member count to return
         const groupToReturn = await prisma.group.findUnique({
             where: { id: newGroup.id },
             include: { _count: { select: { members: true }}}
         });


        return NextResponse.json(groupToReturn, { status: 201 }); // 201 Created

    } catch (error) {
        console.error('Create Group Error:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            // Handle potential unique constraint on group name if added to schema
            return NextResponse.json({ message: 'A group with this name might already exist.' }, { status: 409 });
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
        return NextResponse.json({ message: 'An error occurred creating the group' }, { status: 500 });
    }
}
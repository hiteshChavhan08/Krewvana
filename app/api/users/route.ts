// app/api/users/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client'; // Make sure Prisma types are imported

// Schema for query parameter validation (same as before)
const querySchema = z.object({
    search: z.string().optional(),
    department: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

export async function GET(request: NextRequest) {
  try {
    // --- Optional Authentication Check ---
    // const session = await getServerSession();
    // if (!session) {
    //   return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }

    const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validation = querySchema.safeParse(queryParams);

    if (!validation.success) {
        return NextResponse.json({ message: 'Invalid query parameters', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { search, department, page, limit } = validation.data;
    const skip = (page - 1) * limit;

    // Initialize with AND as an empty array
    const whereClause: Prisma.UserWhereInput = { AND: [] };

    if (search) {
        // --- FIX: Assert that whereClause.AND is an array before pushing ---
        (whereClause.AND as Prisma.UserWhereInput[]).push({
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                // Add other searchable public fields if needed
                // { profile: { jobTitle: { contains: search, mode: 'insensitive' } } }
            ]
        });
    }
    if (department) {
         // --- FIX: Assert that whereClause.AND is an array before pushing ---
        (whereClause.AND as Prisma.UserWhereInput[]).push({
            profile: { department: { equals: department, mode: 'insensitive' } }
        });
    }

    // --- Optional refinement: If AND array is empty, remove it ---
    // This avoids sending an unnecessary empty AND clause to Prisma
    if ((whereClause.AND as Prisma.UserWhereInput[]).length === 0) {
        delete whereClause.AND;
    }

    // Fetch users with filters and pagination
    const users = await prisma.user.findMany({
      where: whereClause, // Use the constructed whereClause
      skip: skip,
      take: limit,
      orderBy: { name: 'asc' },
      select: { // Select only PUBLIC fields
        id: true,
        name: true,
        image: true,
        createdAt: true,
        profile: { select: { department: true, jobTitle: true, skills: true } } // Adjust public profile fields
      }
    });

    // Get total count with the same filter applied
    const totalUsers = await prisma.user.count({ where: whereClause });
    const totalPages = Math.ceil(totalUsers / limit);

    return NextResponse.json({
      data: users,
      pagination: { currentPage: page, totalPages, totalUsers, limit }
    });

  } catch (error) {
    console.error('List Users Error:', error);
    if (error instanceof z.ZodError) {
        return NextResponse.json({ message: 'Invalid query parameters', errors: error.flatten().fieldErrors }, { status: 400 });
    }
    // Handle other potential errors (e.g., Prisma errors)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error("Prisma Error Code:", error.code);
        // Handle specific Prisma errors if needed
    }
    return NextResponse.json({ message: 'An error occurred listing users' }, { status: 500 });
  }
}
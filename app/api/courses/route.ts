// --- File: app/api/courses/route.ts ---
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET handler to fetch all courses
export async function GET(request: Request) {
  try {
    const courses = await prisma.course.findMany({
      orderBy: {
        createdAt: 'desc', // Show newest courses first
      },
      // Add pagination later if needed (using take and skip)
    });
    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST handler (Example - Add later if needed for creating courses via API)
// export async function POST(request: Request) { ... }

// app/api/mentorship/skills/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma'; // Adjust path if needed
import { getCurrentUser } from '@/lib/auth'; // Adjust path if needed

// Schema for creating a skill
const createSkillSchema = z.object({
  name: z.string().min(3, 'Skill name must be at least 3 characters'),
  description: z.string().optional(),
});

// GET Handler - List all skills
export async function GET() {
  try {
    // Optional: Add authentication check if only logged-in users can see skills
    // const user = await getCurrentUser();
    // if (!user) {
    //   return new NextResponse('Unauthorized', { status: 401 });
    // }

    const skills = await prisma.mentorshipSkill.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(skills);
  } catch (error) {
    console.error("Error fetching skills:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST Handler - Create a new skill
export async function POST(req: Request) {
  try {
    // TODO: Implement Admin check here later if needed
    const user = await getCurrentUser();
    if (!user) { // Require logged-in user at minimum
       return new NextResponse('Unauthorized', { status: 401 });
    }
    // --- Add Admin Role Check ---
    // if (!user.isAdmin) { // Assuming an isAdmin field on User model
    //    return new NextResponse('Forbidden: Admin required', { status: 403 });
    // }
    // --- End Admin Role Check ---


    const body = await req.json();
    const validation = createSkillSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.errors }, { status: 400 });
    }

    const { name, description } = validation.data;

    // Check if skill name already exists
    const existingSkill = await prisma.mentorshipSkill.findUnique({
      where: { name },
    });

    if (existingSkill) {
      return NextResponse.json({ message: 'Skill with this name already exists' }, { status: 409 }); // 409 Conflict
    }

    const newSkill = await prisma.mentorshipSkill.create({
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(newSkill, { status: 201 }); // 201 Created
  } catch (error) {
     if (error instanceof z.ZodError) { // Catch Zod validation errors specifically
        return NextResponse.json({ errors: error.errors }, { status: 400 });
      }
    console.error("Error creating skill:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
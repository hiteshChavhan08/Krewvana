// app/api/mentorship/circles/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { MentorshipCircleStatus, MembershipStatus, MentorshipRole } from '@prisma/client'; // Import enums

// Constants for Gamification
const POINTS_FOR_PROPOSING_CIRCLE = 15; // Define points value
const REASON_PROPOSE_CIRCLE = "Proposed Mentorship Circle"; // Define reason string

// Schema for creating a circle
const createCircleSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  skillId: z.string().cuid('Invalid Skill ID format'),
  maxMentees: z.number().int().positive().optional().nullable(), // Optional, positive integer
});

// GET Handler - List circles
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.getAll('status') as MentorshipCircleStatus[]; // Get status filters
    const skillId = searchParams.get('skillId');
    const view = searchParams.get('view'); // 'my' or 'discover'

    let whereClause: any = {};

    // Filter by Status (if provided)
    if (status && status.length > 0) {
      // Validate statuses are valid enum values before using them
      const validStatuses = status.filter(s => Object.values(MentorshipCircleStatus).includes(s));
       if (validStatuses.length > 0) {
         whereClause.status = { in: validStatuses };
       }
    } else if (view !== 'my') {
      // Default to showing FORMING and ACTIVE for discovery if no specific status filter
      whereClause.status = { in: [MentorshipCircleStatus.FORMING, MentorshipCircleStatus.ACTIVE] };
    }


    // Filter by Skill (if provided)
    if (skillId) {
      whereClause.skillId = skillId;
    }

    // Filter by User Involvement ('my' view)
    if (view === 'my') {
      whereClause.members = {
        some: {
          userId: user.id,
          // Optionally filter by active memberships if needed
          // status: MembershipStatus.ACTIVE
        },
      };
    }

    const circles = await prisma.mentorshipCircle.findMany({
      where: whereClause,
      include: {
        skill: true, // Include skill details
        creator: { // Include basic creator info
          select: { id: true, name: true, image: true }
        },
        members: { // Include members to show count or list them
          where: { status: MembershipStatus.ACTIVE }, // Only count active members for slots
          select: { id: true, role: true, user: { select: { id: true, name: true, image: true } } }
        },
        _count: { // Efficiently count active members
           select: { members: { where: { status: MembershipStatus.ACTIVE }}}
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(circles);
  } catch (error) {
    console.error("Error fetching circles:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


// POST Handler - Propose a new circle
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const validation = createCircleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.errors }, { status: 400 });
    }

    const { title, description, skillId, maxMentees } = validation.data;

    // Verify the skill exists
    const skillExists = await prisma.mentorshipSkill.findUnique({ where: { id: skillId } });
    if (!skillExists) {
       return NextResponse.json({ message: 'Selected skill not found' }, { status: 404 });
    }
    // --- Use Prisma Transaction ---
    const result = await prisma.$transaction(async (tx) => {
        const newCircle = await prisma.mentorshipCircle.create({
            data: {
              title,
              description,
              skillId,
              maxMentees,
              creatorId: user.id,
              status: MentorshipCircleStatus.FORMING, // Default status when a user proposes
              members: {
                create: {
                  userId: user.id,
                  role: MentorshipRole.MENTOR,
                  status: MembershipStatus.ACTIVE, // Mentor is active immediately
                },
              },
            },
            include: { // Include details needed for immediate display
              skill: true,
              creator: { select: { id: true, name: true, image: true } },
              members: { include: { user: { select: { id: true, name: true, image: true } } } }
            }
          });

          // 2. Update the user's points
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          points: {
            increment: POINTS_FOR_PROPOSING_CIRCLE, // Add points
          },
        },
         select: { points: true } // Select only the updated points count
      });

      // 3. Create a PointLog entry
      await tx.pointLog.create({
        data: {
          userId: user.id,
          pointsAwarded: POINTS_FOR_PROPOSING_CIRCLE,
          reason: `${REASON_PROPOSE_CIRCLE}: "${newCircle.title}"`, // Add circle title for context
          // Link to the specific circle if you add the relation later
          // mentorshipCircleId: newCircle.id
        },
      });

      // Return the created circle and updated points from the transaction
      return { newCircle, updatedPoints: updatedUser.points };
    })
    // Create the circle and add the creator as the first MENTOR
    

    return NextResponse.json(result.newCircle, { status: 201 });
  } catch (error) {
     if (error instanceof z.ZodError) {
        return NextResponse.json({ errors: error.errors }, { status: 400 });
      }
    console.error("Error proposing circle:", error);
    // Handle potential Prisma errors (e.g., foreign key constraint) if needed
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
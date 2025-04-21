// app/api/mentorship/circles/[circleId]/join/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { MentorshipRole, MembershipStatus, MentorshipCircleStatus } from '@prisma/client';

// POST Handler - Current user requests to join a circle as MENTEE
export async function POST(
  req: Request, // req is unused here but required by the signature
  { params }: { params: { circleId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { circleId } = params;

    if (!circleId) {
        return NextResponse.json({ message: 'Circle ID is required' }, { status: 400 });
    }

    // 1. Find the circle and check its status and capacity
    const circle = await prisma.mentorshipCircle.findUnique({
        where: { id: circleId },
        include: {
            _count: {
                select: { members: { where: { status: MembershipStatus.ACTIVE }}}
            }
        }
    });

    if (!circle) {
        return new NextResponse('Circle not found', { status: 404 });
    }

    if (circle.status !== MentorshipCircleStatus.FORMING && circle.status !== MentorshipCircleStatus.ACTIVE) {
        return NextResponse.json({ message: 'Circle is not accepting new members' }, { status: 400 });
    }

    // Check capacity if maxMentees is set
    if (circle.maxMentees !== null && circle._count.members >= circle.maxMentees) {
         return NextResponse.json({ message: 'Circle is full' }, { status: 400 });
    }


    // 2. Check if user is already a member (any status)
    const existingMembership = await prisma.mentorshipCircleMember.findUnique({
      where: {
        circleId_userId: { // Using the @@unique constraint
          circleId: circleId,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      // Handle different statuses - maybe allow re-request if declined/left?
      if (existingMembership.status === MembershipStatus.ACTIVE) {
          return NextResponse.json({ message: 'You are already an active member of this circle' }, { status: 409 });
      }
      if (existingMembership.status === MembershipStatus.PENDING) {
           return NextResponse.json({ message: 'Your request to join is already pending' }, { status: 409 });
      }
       // Potentially allow re-joining if REMOVED or LEFT - depends on product requirements
       // For now, just prevent duplicates
        return NextResponse.json({ message: 'You have a previous membership record with this circle' }, { status: 409 });
    }

    // 3. Create the PENDING membership request
    const newMembership = await prisma.mentorshipCircleMember.create({
      data: {
        userId: user.id,
        circleId: circleId,
        role: MentorshipRole.MENTEE,
        status: MembershipStatus.PENDING, // Request needs approval
      },
      include: { // Return the user details with the membership
        user: { select: { id: true, name: true, image: true } }
      }
    });

    // TODO: Add notification logic here later (notify mentor(s))

    return NextResponse.json(newMembership, { status: 201 });

  } catch (error) {
    // Handle potential Prisma errors (e.g., unique constraint violation if race condition)
    console.error(`Error joining circle ${params.circleId}:`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
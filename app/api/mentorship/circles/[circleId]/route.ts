// app/api/mentorship/circles/[circleId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { MembershipStatus, MentorshipCircleStatus, MentorshipRole } from '@prisma/client';
import { z } from 'zod';

// Helper function (if not already defined elsewhere)
async function isMentorOfCircle(userId: string, circleId: string): Promise<boolean> {
    const mentorMembership = await prisma.mentorshipCircleMember.findFirst({
        where: { circleId, userId, role: MentorshipRole.MENTOR, status: MembershipStatus.ACTIVE }
    });
    return !!mentorMembership;
}

// Schema for updating circle status (can be expanded later for other fields)
const updateCircleStatusSchema = z.object({
    status: z.nativeEnum(MentorshipCircleStatus), // Expecting a valid status enum value
    // Add other editable fields later: title, description, maxMentees etc.
    // title: z.string().min(5).optional(),
    // description: z.string().optional(),
    // maxMentees: z.number().int().positive().optional().nullable(),
  });
  
// GET Handler - Fetch details for a specific circle
export async function GET(
  req: Request,
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

    const circle = await prisma.mentorshipCircle.findUnique({
      where: { id: circleId },
      include: {
        skill: true,
        creator: { select: { id: true, name: true, image: true } },
        members: { // Include all members for detail view
          include: {
            user: { select: { id: true, name: true, image: true, email: true } } // Include email for contact maybe
          },
          orderBy: [{role: 'asc'}, {joinedAt: 'asc'}] // Show mentors first, then by join date
        },
         _count: { // Efficiently count active members
           select: { members: { where: { status: MembershipStatus.ACTIVE }}}
        }
      },
    });

    if (!circle) {
      return new NextResponse('Circle not found', { status: 404 });
    }

    // Basic authorization: Check if user is part of the circle or maybe an admin?
    // For now, any logged-in user can view details, adjust as needed.
    // const isMember = circle.members.some(member => member.userId === user.id);
    // if (!isMember && !user.isAdmin) { // Example if only members/admins can view
    //    return new NextResponse('Forbidden', { status: 403 });
    // }


    return NextResponse.json(circle);
  } catch (error) {
    console.error(`Error fetching circle ${params.circleId}:`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PUT Handler - Update Circle Status (and potentially details)
export async function PUT(
    req: Request,
    { params }: { params: { circleId: string } }
  ) {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
  
      const { circleId } =  await params;
      if (!circleId) {
        return NextResponse.json({ message: 'Circle ID is required' }, { status: 400 });
      }
  
      // Authorization: Ensure user is a Mentor or Admin
      const isMentor = await isMentorOfCircle(user.id, circleId);
      const isAdmin = false; // TODO: Implement admin check
      if (!isMentor && !isAdmin) {
        return new NextResponse('Forbidden: Only mentors or admins can update the circle', { status: 403 });
      }
  
      // Validate request body
      const body = await req.json();
      const validation = updateCircleStatusSchema.safeParse(body);
  
      if (!validation.success) {
        return NextResponse.json({ errors: validation.error.errors }, { status: 400 });
      }
  
      const { status: newStatus, /* other fields */ } = validation.data;
  
      // --- Add Status Transition Logic/Validation if needed ---
      // e.g., prevent changing status back from COMPLETED or CANCELLED?
      const currentCircle = await prisma.mentorshipCircle.findUnique({
          where: { id: circleId },
          select: { status: true }
      });
  
      if (!currentCircle) {
           return new NextResponse('Circle not found', { status: 404 });
      }
  
      // Example validation: Cannot change status if already completed/cancelled
      if (currentCircle.status === MentorshipCircleStatus.COMPLETED || currentCircle.status === MentorshipCircleStatus.CANCELLED) {
          if (newStatus !== currentCircle.status) { // Allow PUTting the same status (idempotency)
              return NextResponse.json({ message: `Cannot change status from ${currentCircle.status}` }, { status: 400 });
          }
      }
      // Add more specific transition rules if necessary (e.g., must be FORMING to become ACTIVE)
      // if (currentCircle.status === MentorshipCircleStatus.FORMING && newStatus !== MentorshipCircleStatus.ACTIVE && newStatus !== MentorshipCircleStatus.CANCELLED) { ... }
  
  
      // Update the circle
      const updatedCircle = await prisma.mentorshipCircle.update({
        where: { id: circleId },
        data: {
          status: newStatus,
          // Add other fields here if the schema allows them:
          // title: validation.data.title ?? undefined, // Only update if provided
          // description: validation.data.description ?? undefined,
          // maxMentees: validation.data.maxMentees // Handles null correctly
        },
         include: { // Return updated details if needed by client
              skill: true,
              creator: { select: { id: true, name: true, image: true } },
              members: {
                  include: { user: { select: { id: true, name: true, image: true } } },
                  orderBy: [{ role: 'asc' }, { status: 'asc' }]
              },
               _count: { select: { members: { where: { status: MembershipStatus.ACTIVE }}}}
          }
      });
  
      // TODO: Add notification logic (e.g., notify members if circle becomes ACTIVE or CANCELLED)
  
      return NextResponse.json(updatedCircle);
  
    } catch (error) {
      if (error instanceof z.ZodError) {
          return NextResponse.json({ errors: error.errors }, { status: 400 });
      }
      console.error(`Error updating circle ${params.circleId}:`, error);
      // Handle potential Prisma errors (e.g., record not found if check wasn't thorough)
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  }
  
  // --- Add DELETE handler later if needed (likely Admin-only) ---
// PUT would need checks to ensure only mentor/admin can update
// DELETE would likely be admin-only or mentor if circle is in specific states
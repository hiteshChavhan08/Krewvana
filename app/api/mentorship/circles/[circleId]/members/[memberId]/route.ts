// app/api/mentorship/circles/[circleId]/members/[memberId]/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { MembershipStatus, MentorshipRole } from '@prisma/client';


// Schema for updating member status (Approval/Decline)
const updateMemberStatusSchema = z.object({
  status: z.enum([MembershipStatus.ACTIVE, MembershipStatus.DECLINED]), // Only allow these transitions via PUT
});


// Helper function to check if current user is a Mentor of the given circle
async function isMentorOfCircle(userId: string, circleId: string): Promise<boolean> {
    const mentorMembership = await prisma.mentorshipCircleMember.findFirst({
        where: {
            circleId: circleId,
            userId: userId,
            role: MentorshipRole.MENTOR,
            status: MembershipStatus.ACTIVE, // Ensure they are an *active* mentor
        }
    });
    return !!mentorMembership;
}


// PUT Handler - Approve/Decline a PENDING membership request
export async function PUT(
  req: Request,
  { params }: { params: { circleId: string; memberId: string } }
) {
   try {
        const user = await getCurrentUser();
        if (!user) {
        return new NextResponse('Unauthorized', { status: 401 });
        }

        const { circleId, memberId } = params;
        if (!circleId || !memberId) {
            return NextResponse.json({ message: 'Circle ID and Member ID are required' }, { status: 400 });
        }

        // Authorize: Check if the current user is a mentor of this circle
        const isMentor = await isMentorOfCircle(user.id, circleId);
        // TODO: Add Admin check later if admins should also manage members
        // const isAdmin = user.isAdmin;
        // if (!isMentor && !isAdmin) {
        if (!isMentor) {
            return new NextResponse('Forbidden: Only mentors can manage requests', { status: 403 });
        }

        // Validate request body
        const body = await req.json();
        const validation = updateMemberStatusSchema.safeParse(body);

        if (!validation.success) {
        return NextResponse.json({ errors: validation.error.errors }, { status: 400 });
        }
        const { status: newStatus } = validation.data;


        // Find the specific membership record to update
        const membershipToUpdate = await prisma.mentorshipCircleMember.findUnique({
            where: { id: memberId, circleId: circleId }, // Ensure memberId belongs to the correct circle
             include: { // Include circle to check capacity on approval
                circle: { select: { maxMentees: true, _count: { select: { members: { where: { status: MembershipStatus.ACTIVE }}}} }}
            }
        });

        if (!membershipToUpdate) {
            return new NextResponse('Membership record not found', { status: 404 });
        }

        // Ensure we are only updating PENDING requests via this PUT method
        if (membershipToUpdate.status !== MembershipStatus.PENDING) {
             return NextResponse.json({ message: `Cannot ${newStatus === MembershipStatus.ACTIVE ? 'approve' : 'decline'} a request that is not pending` }, { status: 400 });
        }

        // Check capacity ONLY IF approving
        if (newStatus === MembershipStatus.ACTIVE) {
            const circle = membershipToUpdate.circle;
            if (circle.maxMentees !== null && circle._count.members >= circle.maxMentees) {
                return NextResponse.json({ message: 'Cannot approve, circle is full' }, { status: 400 });
            }
        }


        // Update the membership status
        const updatedMembership = await prisma.mentorshipCircleMember.update({
            where: { id: memberId },
            data: { status: newStatus },
            include: { // Return updated member details
                user: { select: { id: true, name: true, image: true } }
            }
        });

         // TODO: Add notification logic (notify applicant of approval/rejection)

        return NextResponse.json(updatedMembership);

   } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.errors }, { status: 400 });
        }
        console.error(`Error updating member ${params.memberId} status in circle ${params.circleId}:`, error);
        return new NextResponse('Internal Server Error', { status: 500 });
   }
}


// DELETE Handler - Remove a member (by Mentor) or Leave (by member themselves)
export async function DELETE(
  req: Request, // req is unused here but required by the signature
  { params }: { params: { circleId: string; memberId: string } }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { circleId, memberId } = params;
        if (!circleId || !memberId) {
            return NextResponse.json({ message: 'Circle ID and Member ID are required' }, { status: 400 });
        }

        // Find the membership record
         const membershipToDelete = await prisma.mentorshipCircleMember.findUnique({
            where: { id: memberId, circleId: circleId },
             select: { userId: true, role: true } // Select needed fields for authorization
        });

        if (!membershipToDelete) {
             return new NextResponse('Membership record not found', { status: 404 });
        }

        // Authorization Check:
        // 1. Is the current user the member themselves? (Allow leaving)
        // 2. Is the current user a mentor of this circle? (Allow removing others, but not the last mentor maybe?)
        // 3. Is the member being deleted a MENTOR? Special handling might be needed (prevent deleting last mentor?).

        const isSelf = membershipToDelete.userId === user.id;
        const isMentor = await isMentorOfCircle(user.id, circleId);
        // TODO: Add Admin check later

        if (!isSelf && !isMentor) { // User is neither the member nor a mentor
             return new NextResponse('Forbidden: Not authorized to remove this member', { status: 403 });
        }

        if (isMentor && isSelf && membershipToDelete.role === MentorshipRole.MENTOR) {
           // Check if they are the *last* active mentor before allowing deletion
           const mentorCount = await prisma.mentorshipCircleMember.count({
                where: {
                    circleId: circleId,
                    role: MentorshipRole.MENTOR,
                    status: MembershipStatus.ACTIVE
                }
           });
           if (mentorCount <= 1) {
                return NextResponse.json({ message: 'Cannot remove the last active mentor. Assign another mentor first or cancel the circle.' }, { status: 400 });
           }
        }


        // Perform the deletion
        await prisma.mentorshipCircleMember.delete({
            where: { id: memberId },
        });

        // TODO: Add notification logic (e.g., notify mentor if member leaves, notify member if removed)

        return new NextResponse(null, { status: 204 }); // 204 No Content on successful delete

    } catch (error) {
        console.error(`Error deleting member ${params.memberId} from circle ${params.circleId}:`, error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
// app/api/ama/sessions/[sessionId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { AMASessionStatus } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';
// Optional: import { getCurrentUser } from '@/lib/auth';
// Schema for updating status
const updateSessionStatusSchema = z.object({
  status: z.nativeEnum(AMASessionStatus), // Must be one of the valid statuses
});

// Helper to check if user can manage the session (Host or Admin)
async function canManageSession(userId: string, sessionId: string): Promise<boolean> {
  const session = await prisma.aMASession.findUnique({
      where: { id: sessionId },
      select: { hostId: true }
  });
  const isAdmin = false; // Replace with actual user admin check
  // const user = await prisma.user.findUnique({where: {id: userId}, select: {isAdmin: true}})
  // const isAdmin = !!user?.isAdmin;
  return session?.hostId === userId || isAdmin;
}

export async function GET(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Optional: User check
    // const user = await getCurrentUser();
    // if (!user) { return new NextResponse('Unauthorized', { status: 401 }); }

    const { sessionId } = params;
    if (!sessionId) {
      return NextResponse.json({ message: 'Session ID required' }, { status: 400 });
    }

    const session = await prisma.aMASession.findUnique({
      where: { id: sessionId },
      include: {
        host: { select: { id: true, name: true, image: true } },
        // Questions will be fetched via a separate endpoint for pagination/filtering
        _count: { select: { questions: true } } // Still useful to show total count
      },
    });

    if (!session) {
      return new NextResponse('AMA Session not found', { status: 404 });
    }

    return NextResponse.json(session);

  } catch (error) {
    console.error(`Error fetching AMA session ${params.sessionId}:`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// --- PUT Handler - Update Session Status (Start/End/Cancel) ---
export async function PUT(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { sessionId } = params;
        if (!sessionId) {
            return NextResponse.json({ message: 'Session ID required' }, { status: 400 });
        }

        // --- Authorization: Host or Admin ---
        const canManage = await canManageSession(currentUser.id, sessionId);
        if (!canManage) {
            return new NextResponse('Forbidden: You cannot manage this session', { status: 403 });
        }
        // --- End Authorization ---

        const body = await req.json();
        const validation = updateSessionStatusSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ errors: validation.error.flatten() }, { status: 400 });
        }

        const { status: newStatus } = validation.data;

        // Optional: Add transition validation (e.g., can only go from UPCOMING to LIVE)
        const currentSession = await prisma.aMASession.findUnique({
            where: {id: sessionId},
            select: { status: true }
        });
        if (!currentSession) {
             return new NextResponse('AMA Session not found', { status: 404 });
        }
        // Example transition logic:
        if (currentSession.status === AMASessionStatus.UPCOMING && newStatus !== AMASessionStatus.LIVE && newStatus !== AMASessionStatus.CANCELLED) {
             return NextResponse.json({ message: `Cannot transition from ${currentSession.status} to ${newStatus}` }, { status: 400 });
        }
        if (currentSession.status === AMASessionStatus.LIVE && newStatus !== AMASessionStatus.ENDED && newStatus !== AMASessionStatus.CANCELLED) {
            return NextResponse.json({ message: `Cannot transition from ${currentSession.status} to ${newStatus}` }, { status: 400 });
        }
        // Cannot change status from ENDED or CANCELLED (unless maybe admin override?)
        if ((currentSession.status === AMASessionStatus.ENDED || currentSession.status === AMASessionStatus.CANCELLED) && newStatus !== currentSession.status) {
             return NextResponse.json({ message: `Session is already ${currentSession.status.toLowerCase()} and cannot be changed.`}, { status: 400 });
        }


        // Update the status
        const updatedSession = await prisma.aMASession.update({
            where: { id: sessionId },
            data: { status: newStatus },
             include: { // Return updated host/count info if needed
                host: { select: { id: true, name: true, image: true } },
                _count: { select: { questions: true } }
             }
        });

        // TODO: Notify participants when session goes LIVE or is CANCELLED?

        return NextResponse.json(updatedSession);

    } catch (error) {
         if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.flatten() }, { status: 400 });
        }
        console.error(`Error updating AMA session ${params.sessionId} status:`, error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
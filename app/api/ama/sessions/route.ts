// app/api/ama/sessions/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { AMASessionStatus, UserRole } from '@prisma/client';

// --- Zod Schema for Creating a Session ---
const createSessionSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(150),
  description: z.string().max(1000).optional(),
  scheduledAt: z.coerce.date({ // Coerce string input to Date object
    errorMap: (issue, { defaultError }) => ({
        message: issue.code === "invalid_date" ? "Please enter a valid date and time" : defaultError,
    })
  }).min(new Date(), { message: "Scheduled date must be in the future" }), // Ensure date is in the future
  hostId: z.string().cuid({ message: "Invalid Host User ID" }), // Admin selects the host
  isTechSpecific: z.boolean().optional().default(false),
  topic: z.string().max(50).optional(),
}).refine(data => !data.isTechSpecific || (data.isTechSpecific && data.topic && data.topic.trim().length > 0), {
    // If tech specific is true, topic must be provided
    message: "A topic is required for tech-specific AMAs",
    path: ["topic"], // Error applies to the topic field
});

// GET Handler - List AMA Sessions
export async function GET(req: Request) {
  try {
    // Optional: Check if user is logged in? For now, assume public listing
    // const user = await getCurrentUser();
    // if (!user) { return new NextResponse('Unauthorized', { status: 401 }); }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as AMASessionStatus | null; // e.g., UPCOMING, ENDED
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    let whereClause: any = {};
    if (status && Object.values(AMASessionStatus).includes(status)) {
      whereClause.status = status;
    }

    const skip = (page - 1) * limit;

    const [sessions, totalCount] = await Promise.all([
        prisma.aMASession.findMany({
            where: whereClause,
            include: {
                host: { // Include basic host info
                    select: { id: true, name: true, image: true }
                },
                _count: { // Count questions (maybe filter approved later?)
                    select: { questions: true }
                }
            },
            orderBy: {
                // Order upcoming soonest first, ended most recent first
                scheduledAt: status === AMASessionStatus.UPCOMING ? 'asc' : 'desc'
            },
            take: limit,
            skip: skip,
        }),
        prisma.aMASession.count({ where: whereClause }) // Get total count for pagination
    ]);


    return NextResponse.json({
        data: sessions,
        pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit)
        }
    });

  } catch (error) {
    console.error("Error fetching AMA sessions:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// --- POST Handler - Create a new AMA Session ---
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // --- Authorization Check: Admin Only ---
    const isAdmin = currentUser.role === UserRole.ADMIN; // !!currentUser.isAdmin; // Replace with your actual admin check
    if (!isAdmin) {
        return new NextResponse('Forbidden: Only admins can create AMA sessions', { status: 403 });
    }
    // --- End Authorization Check ---

    const body = await req.json();
    const validation = createSessionSchema.safeParse(body);

    if (!validation.success) {
      console.error("AMA Session Validation Errors:", validation.error.flatten()); // Log detailed errors
      return NextResponse.json({ errors: validation.error.flatten() }, { status: 400 });
    }

    const { title, description, scheduledAt, hostId, isTechSpecific, topic } = validation.data;

    // Optional: Verify the selected hostId exists
    const hostExists = await prisma.user.findUnique({ where: { id: hostId } });
    if (!hostExists) {
         return NextResponse.json({ errors: { hostId: ["Selected host user not found."] }}, { status: 400 });
    }

    // Create the session
    const newSession = await prisma.aMASession.create({
      data: {
        title,
        description,
        scheduledAt,
        hostId,
        isTechSpecific,
        topic: isTechSpecific ? topic : null, // Only save topic if tech specific
        status: AMASessionStatus.UPCOMING, // Default status
      },
      include: { // Include data needed for immediate display/confirmation
          host: { select: { id: true, name: true, image: true } },
      }
    });

    // TODO: Notify the selected host about the new session?

    return NextResponse.json(newSession, { status: 201 }); // 201 Created

  } catch (error) {
     if (error instanceof z.ZodError) { // Catch Zod errors specifically if needed elsewhere
        // This is already handled by safeParse, but good practice
        console.error("Zod Error during AMA Session Creation:", error.flatten());
        return NextResponse.json({ errors: error.flatten() }, { status: 400 });
      }
    console.error("Error creating AMA session:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
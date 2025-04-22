// app/api/ama/sessions/[sessionId]/questions/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth"; // Needed for submitter ID and maybe filtering logic
import { AMASessionStatus, UserRole } from "@prisma/client";

const submitQuestionSchema = z.object({
  text: z.string().min(10, "Question must be at least 10 characters").max(1000),
  isAnonymous: z.boolean().optional().default(false),
});
// Helper function to check if user is host or admin (implement actual admin check later)
async function canModerateQuestion(
  userId: string,
  sessionId: string
): Promise<boolean> {
  console.log(
    `[canModerateQuestion] Checking: userId='${userId}', sessionId='${sessionId}'`
  ); // Log input
  if (!userId || !sessionId) {
    console.log("[canModerateQuestion] Error: Missing userId or sessionId");
    return false;
  }
  try {
    const [sessionResult, currentUserResult] = await Promise.all([
      prisma.aMAQuestion.findUnique({
        where: { id: sessionId },
        select: { session: { select: { hostId: true } } }, // Get hostId via session relation
      }),
      prisma.user.findUnique({
        // Get current user's role
        where: { id: userId },
        select: { role: true },
      }),
    ]);
    // Log fetched data
    console.log("[canModerateQuestion] Fetched session:", sessionId);
    console.log("[canModerateQuestion] Fetched currentUser:", currentUserResult);
    if (!sessionId || !currentUserResult) {
      console.log(
        "[canModerateQuestion] Failed to fetch session or current user."
      );
      return false;
    }

    const isHost = sessionResult?.session.hostId === userId;
    const isAdmin = currentUserResult.role === UserRole.ADMIN;

    // Log the results of the checks
    console.log(
      `[canModerateQuestion] Check results: isHost=${isHost}, isAdmin=${isAdmin}`
    );

    return isHost || isAdmin; // Return true if either is true
  } catch (error) {
    console.error("[canModerateQuestion] Error during check:", error);
    return false;
  }
}
// GET Handler - List questions for a specific session
export async function GET(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const user = await getCurrentUser(); // Check user for potential filtering later
    // if (!user) { return new NextResponse('Unauthorized', { status: 401 }); }

    const { sessionId } = await params;
    if (!user) {
      console.log("[API Questions GET] No user found, applying regular filters.");
       // Apply regular user filters if no user logged in
       let whereClause: any = { sessionId: sessionId, isApproved: true };
       const questions = await prisma.aMAQuestion.findMany({ where: whereClause, /* ... */ });
       // ... process and return ...
       return NextResponse.json([]); // Or however you handle unauthenticated
  }
    if (!sessionId) {
      return NextResponse.json(
        { message: "Session ID required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    // Filters (e.g., ?answered=true, ?approved=true) - default show approved/answered?
    const answered = searchParams.get("answered"); // 'true' or 'false'
    const approved = searchParams.get("approved"); // 'true' or 'false'
    const mine = searchParams.get("mine"); // 'true' - show questions submitted by current user?

    let whereClause: any = { sessionId: sessionId };

    // --- Basic Filtering Logic ---
    // Default: Show approved & answered questions to everyone
    // whereClause.isApproved = true;
    const canModerate = user
      ? await canModerateQuestion(user.id, sessionId)
      : false;
    console.log(
      `[API Questions GET] User ID: ${user?.id}, Session ID: ${sessionId}, Can Moderate: ${canModerate}`
    );

    // --- Filtering Logic ---
    if (canModerate) {
      // Host/Admin View: More flexible filtering based on query params
      console.log("[API Questions GET] Applying Host/Admin filters");
      console.log(
        "[API Questions GET] Applying Host/Admin filters (if any from query params)"
      );
      if (approved === "true") {
        whereClause.isApproved = true;
      }
      if (approved === "false") {
        whereClause.isApproved = false;
      }
      // If neither approved=true nor approved=false is specified, show ALL (approved and pending)

      if (answered === "true") {
        whereClause.answerText = { not: null };
      }
      if (answered === "false") {
        // Important: If filtering for unanswered, usually still want approved ones unless specifically asking for pending unanswered
        if (approved === "false") {
          whereClause.isApproved = false; // Show pending unanswered
        }
        whereClause.answerText = null;
      }
      // If neither answered=true nor answered=false is specified, show ALL (answered and unanswered)
    } else {
      // Regular User View: Default to showing APPROVED questions (answered or unanswered)
      console.log("[API Questions GET] Applying Regular User filters");
      console.log("[API Questions GET] Applying Regular User filters");
      whereClause.isApproved = true;

      // Allow regular users to filter by answered status *within* approved questions
      if (answered === "true") {
        whereClause.answerText = { not: null };
      }
      if (answered === "false") {
        whereClause.answerText = null;
      }
    }
    console.log("[API Questions GET] Final whereClause:", whereClause);

    // TODO: Add logic for HOST/ADMIN to see unapproved questions
    // const session = await prisma.aMASession.findUnique({ where: {id: sessionId}, select: {hostId: true}});
    // const isHost = user && session?.hostId === user.id;
    // if (isHost || isAdmin) {
    //    // Modify whereClause to show pending based on filters
    //    if (approved === 'false') { whereClause.isApproved = false; }
    //    else { delete whereClause.isApproved; } // Show all if host and no specific filter
    // }

    // TODO: Add logic for 'mine' filter
    // if (mine === 'true' && user) {
    //    whereClause = { sessionId: sessionId, submittedById: user.id }; // Override other filters
    // }

    // --- Fetch Questions ---
    const questions = await prisma.aMAQuestion.findMany({
      where: whereClause,
      include: {
        // Include submitter only if NOT anonymous
        submittedBy: { select: { id: true, name: true, image: true } },
        answeredBy: { select: { id: true, name: true, image: true } },
      },
      orderBy: [
        { answeredAt: "desc" }, // Show most recently answered first
        { createdAt: "asc" }, // Then oldest submitted
      ],
      // Add pagination later if needed
    });
    console.log(
      `[API Questions GET] Found ${questions.length} questions with simplified filter.`
    );
    // --- Anonymize Data ---
    const processedQuestions = questions.map((q) => ({
      ...q,
      // Explicitly nullify submitter if anonymous
      submittedBy: q.isAnonymous ? null : q.submittedBy,
      submittedById: q.isAnonymous ? null : q.submittedById,
    }));

    return NextResponse.json(processedQuestions);
  } catch (error) {
    // console.error(`Error fetching questions for AMA session ${params.sessionId}:`, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST Handler - Submit a question for a session
export async function POST(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json(
        { message: "Session ID required" },
        { status: 400 }
      );
    }

    // Check if session exists and is upcoming/live (can users submit after it ends?)
    const session = await prisma.aMASession.findUnique({
      where: { id: sessionId },
      select: { status: true },
    });
    if (!session) {
      return new NextResponse("AMA Session not found", { status: 404 });
    }
    if (
      session.status !== AMASessionStatus.UPCOMING &&
      session.status !== AMASessionStatus.LIVE
    ) {
      return NextResponse.json(
        {
          message: `Cannot submit questions for a session that is ${session.status.toLowerCase()}`,
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validation = submitQuestionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.errors },
        { status: 400 }
      );
    }

    const { text, isAnonymous } = validation.data;

    const newQuestion = await prisma.aMAQuestion.create({
      data: {
        text,
        isAnonymous,
        sessionId: sessionId,
        submittedById: user.id, // Associate with logged-in user
        isApproved: false, // Questions likely require approval by default
      },
      // Select fields needed for immediate feedback, anonymizing if needed
      select: {
        id: true,
        text: true,
        isAnonymous: true,
        createdAt: true,
        submittedBy: { select: { id: true, name: true, image: true } },
      },
    });

    // Anonymize response if needed before sending back
    const responseData = {
      ...newQuestion,
      submittedBy: newQuestion.isAnonymous ? null : newQuestion.submittedBy,
    };

    // TODO: Notify Host/Admin of new question?

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }
    console.error(
      `Error submitting question for AMA session ${params.sessionId}:`,
      error
    );
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

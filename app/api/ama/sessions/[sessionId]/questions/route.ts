// app/api/ama/sessions/[sessionId]/questions/route.ts
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import {
    respondSuccess, respondError, respondBadRequest, respondUnauthorized, respondForbidden, respondNotFound,
    ApiError, BadRequestError, NotFoundError // Import necessary utilities
} from '@/lib/api/responses';
import {
    listAmaSessionQuestions, submitAmaQuestion, submitQuestionSchema // Import services and schema
} from '@/services/amaService';
import { NextResponse } from 'next/server';

// Helper function to parse boolean query parameters
const parseBoolean = (value: string | null): boolean | null => {
    if (value === null) return null;
    return value.toLowerCase() === 'true';
};

// GET Handler - List questions for a specific session
export async function GET(
  req: Request,
  { params }: { params: { sessionId?: string } }
) {
  try {
    // 1. Authentication (optional for listing, service handles null user)
    const user = await getCurrentUser();

    // 2. Parameter Validation
    const { sessionId } = await params;
    if (!sessionId) {
       throw new BadRequestError("Session ID parameter is required.");
    }

    // 3. Parse and Validate Filters from Query Params
    const { searchParams } = new URL(req.url);
    const filter = {
        approved: parseBoolean(searchParams.get("approved")),
        answered: parseBoolean(searchParams.get("answered")),
        mine: parseBoolean(searchParams.get("mine")),
    };
    // Add pagination parsing if implemented in service

    // 4. Call Service Function
    const questions = await listAmaSessionQuestions({
        sessionId,
        filter,
        requestingUser: user, // Pass user (or null) for authorization checks in service
        // Add pagination params if implemented
    });

    // 5. Success Response
    return respondSuccess(questions);

  } catch (error: any) {
    // 6. Centralized Error Handling
    if (error instanceof BadRequestError) return respondBadRequest(error.message);
    console.error(`[API GET /api/ama/sessions/${params.sessionId}/questions] Error:`, error);
    return respondError("Failed to fetch questions for the session.");
  }
}

// POST Handler - Submit a question for a session
export async function POST(
  req: Request,
  { params }: { params: { sessionId?: string } }
) {
  try {
    // 1. Authentication
    const user = await getCurrentUser();
    if (!user?.id) { // Need user ID for submitting
        return respondUnauthorized();
    }

    // 2. Parameter Validation
    const { sessionId } = params;
    if (!sessionId) {
       throw new BadRequestError("Session ID parameter is required.");
    }

    // 3. Request Body Parsing and Validation
    let validatedBody: z.infer<typeof submitQuestionSchema>;
    try {
        const body = await req.json();
        const validation = submitQuestionSchema.safeParse(body);
        if (!validation.success) {
            throw new BadRequestError("Invalid request body.", validation.error.flatten().fieldErrors as any);
        }
        validatedBody = validation.data;
    } catch (e) {
        if (e instanceof SyntaxError) throw new BadRequestError("Invalid JSON format.");
        if (e instanceof BadRequestError) throw e; // Re-throw Zod validation errors
        throw e; // Re-throw other parsing errors
    }

    // 4. Authorization (implicit via auth check) & Business Logic (handled by service)
    const newQuestion = await submitAmaQuestion(sessionId, validatedBody, user);

    // 5. Success Response
    return respondSuccess(newQuestion, 201); // 201 Created

  } catch (error: any) {
    // 6. Centralized Error Handling
    if (error instanceof ApiError) {
        if (error instanceof BadRequestError) return respondBadRequest(error.message, error.errors);
        if (error instanceof NotFoundError) return respondNotFound(error.message); // Session not found or invalid status
        // Add ForbiddenError check if submitAmaQuestion implements further auth logic
    }
    console.error(`[API POST /api/ama/sessions/${params.sessionId}/questions] Error:`, error);
    return respondError("Failed to submit question.");
  }
}

// Add explicit handlers for other methods to return 405 Method Not Allowed
export async function PUT() { return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 }); }
export async function PATCH() { return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 }); }
export async function DELETE() { return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 }); }
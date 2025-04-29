// app/api/ama/sessions/route.ts
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  respondSuccess,
  respondError,
  respondBadRequest,
  respondUnauthorized,
  respondForbidden,
  ApiError,
  BadRequestError,
  ForbiddenError, // Import necessary utilities
} from "@/lib/api/responses";
import {
  listAmaSessions,
  createAmaSession,
  createSessionSchema, // Import services and schema
} from "@/services/amaService";
import { AMASessionStatus } from "@prisma/client";

// GET Handler - List AMA Sessions
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Validate and parse query params
    const status = searchParams.get("status") as AMASessionStatus | null;
    const limitParam = searchParams.get("limit");
    const pageParam = searchParams.get("page");

    // Basic validation for pagination params
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > 100) {
      throw new BadRequestError("Invalid pagination parameters (page/limit).");
    }
    // Validate status enum
    if (status && !Object.values(AMASessionStatus).includes(status)) {
      throw new BadRequestError(
        `Invalid status value. Allowed values are: ${Object.values(
          AMASessionStatus
        ).join(", ")}`
      );
    }

    // Call service function
    const result = await listAmaSessions({
      status,
      page,
      limit,
    });

    return respondSuccess(result);
  } catch (error: any) {
    if (error instanceof BadRequestError)
      return respondBadRequest(error.message);
    console.error("[API GET /api/ama/sessions] Error:", error);
    return respondError("Failed to fetch AMA sessions.");
  }
}

// POST Handler - Create a new AMA Session
export async function POST(req: Request) {
  try {
    // 1. Authentication (and get user details needed for service)
    const user = await getCurrentUser();
    if (!user || user.role === undefined) {
      // Ensure role is available
      return respondUnauthorized("Authentication required with valid role.");
    }

    // 2. Request Body Parsing and Validation
    let validatedBody: z.infer<typeof createSessionSchema>;
    try {
      const body = await req.json();
      const validation = createSessionSchema.safeParse(body);
      if (!validation.success) {
        // Use flatten() for potentially cleaner error structure
        throw new BadRequestError(
          "Invalid request body.",
          validation.error.flatten().fieldErrors as any
        );
      }
      validatedBody = validation.data;
    } catch (e) {
      if (e instanceof SyntaxError)
        throw new BadRequestError("Invalid JSON format.");
      if (e instanceof BadRequestError) throw e; // Re-throw Zod validation errors
      throw e; // Re-throw other parsing errors
    }

    // 3. Authorization & Business Logic (handled by service)
    const newSession = await createAmaSession(validatedBody, user);

    // 4. Success Response
    return respondSuccess(newSession, 201); // 201 Created
  } catch (error: any) {
    // 5. Centralized Error Handling
    if (error instanceof ApiError) {
      if (error instanceof BadRequestError)
        return respondBadRequest(error.message, error.errors);
      if (error instanceof ForbiddenError)
        return respondForbidden(error.message);
      // Add other specific ApiError checks if needed (e.g., NotFoundError for host check)
    }
    console.error("[API POST /api/ama/sessions] Error:", error);
    return respondError("Failed to create AMA session.");
  }
}

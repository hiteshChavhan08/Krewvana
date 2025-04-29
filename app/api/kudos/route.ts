// app/api/kudos/route.ts
import { NextResponse } from "next/server";
import { z } from "zod"; // Keep Zod for potential use or if schema is here
import { getCurrentUser } from "@/lib/auth"; // Use our utility
import { KudosCreateSchema } from "@/lib/schemas"; // Import the schema
import {
  respondSuccess,
  respondError,
  respondBadRequest,
  respondUnauthorized,
  respondForbidden,
  respondNotFound,
  ApiError,
  BadRequestError,
  ForbiddenError,
  NotFoundError, // Import utilities & errors
} from "@/lib/api/responses";
import {
  listKudosFeed,
  createKudos, // Import service functions
} from "@/services/kudosService";
import { Prisma } from "@prisma/client"; // Import Prisma for specific error types

// --- GET Handler ---
export async function GET(request: Request) {
  try {
    // 1. Authentication (Optional - decide if feed is public or requires login)
    // const user = await getCurrentUser();
    // if (!user) return respondUnauthorized();

    // 2. Parse query params (e.g., limit)
    // For simplicity, using default limit from service for now
    const limit = 20; // Or parse from request.url searchParams if needed

    // 3. Call Service Function
    const kudosFeed = await listKudosFeed(limit);

    // 4. Success Response
    return respondSuccess(kudosFeed);
  } catch (error: any) {
    // 5. Centralized Error Handling
    console.error("[API GET /api/kudos] Error:", error);
    // Check for specific ApiErrors if listKudosFeed could throw them (unlikely here)
    return respondError("Failed to fetch Kudos feed.");
  }
}

// --- POST Handler ---
export async function POST(request: Request) {
  try {
    // 1. Authentication
    const user = await getCurrentUser();
    if (!user?.id) {
      // Ensure user ID exists
      return respondUnauthorized();
    }

    // 2. Request Body Parsing and Validation
    let validatedBody: z.infer<typeof KudosCreateSchema>;
    try {
      const body = await request.json();
      const validation = KudosCreateSchema.safeParse(body);
      if (!validation.success) {
        throw new BadRequestError(
          "Invalid request body.",
          validation.error.flatten().fieldErrors as any
        );
      }
      validatedBody = validation.data;
    } catch (e) {
      if (e instanceof SyntaxError)
        throw new BadRequestError("Invalid JSON format.");
      if (e instanceof BadRequestError) throw e; // Re-throw Zod validation error
      throw e; // Re-throw other parsing errors
    }

    // 3. Authorization & Business Logic (handled by service)
    const newKudos = await createKudos(validatedBody, user);

    // 4. Success Response
    return respondSuccess(newKudos, 201); // 201 Created
  } catch (error: any) {
    // 5. Centralized Error Handling
    if (error instanceof ApiError) {
      // Handle specific errors thrown by createKudos service
      if (error instanceof BadRequestError)
        return respondBadRequest(error.message, error.errors);
      if (error instanceof ForbiddenError)
        return respondForbidden(error.message); // e.g., self-kudos
      if (error instanceof NotFoundError) return respondNotFound(error.message); // e.g., receiver not found
    }
    // Handle potential Prisma transaction errors separately if needed
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(
        "[API POST /api/kudos] Prisma Error:",
        error.code,
        error.message
      );
      return respondError("Database error occurred during Kudos creation."); // More specific DB error
    }
    console.error("[API POST /api/kudos] Error:", error);
    return respondError("Failed to create Kudos."); // Generic fallback
  }
}

// Add explicit handlers for other methods if needed
export async function PUT() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
export async function DELETE() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
export async function PATCH() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}

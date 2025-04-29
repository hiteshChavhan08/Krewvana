// app/api/questions/route.ts
import { z } from "zod";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  respondSuccess,
  respondError,
  respondBadRequest,
  respondUnauthorized,
  ApiError,
  BadRequestError,
  ForbiddenError,
  respondForbidden, // Import utilities & errors
} from "@/lib/api/responses";
import {
  createQuestion,
  listQuestions,
  CreateQuestionInputSchema, // Import services and schema
} from "@/services/qnaService";
import { Prisma } from "@prisma/client"; // For SortOrder type if needed

// POST Handler - Create Question
export async function POST(request: Request) {
  try {
    // 1. Authentication
    const user = await getCurrentUser();
    if (!user?.id) {
      // Ensure user ID exists
      return respondUnauthorized();
    }

    // 2. Request Body Parsing and Validation
    let validatedBody: z.infer<typeof CreateQuestionInputSchema>;
    try {
      const body = await request.json();
      const validation = CreateQuestionInputSchema.safeParse(body);
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

    // 3. Business Logic (handled by service)
    const newQuestion = await createQuestion(validatedBody, user);

    // 4. Success Response
    return respondSuccess(newQuestion, 201); // 201 Created
  } catch (error: any) {
    // 5. Centralized Error Handling
    if (error instanceof ApiError) {
      if (error instanceof BadRequestError)
        return respondBadRequest(error.message, error.errors);
      if (error instanceof ForbiddenError)
        return respondForbidden(error.message); // Should not happen here usually
    }
    console.error("[API POST /api/questions] Error:", error);
    return respondError("Failed to create question.");
  }
}

// GET Handler - List Questions
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // 2. Parse and Validate Query Params
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const sortBy =
      (searchParams.get("sortBy") as "createdAt" | "votes" | "answers") ||
      "createdAt";
    const order = (searchParams.get("order") as "asc" | "desc") || "desc";
    const tagName = searchParams.get("tag");

    // Validate pagination
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > 100) {
      throw new BadRequestError("Invalid pagination parameters (page/limit).");
    }
    // Validate sorting params (basic check)
    if (!["createdAt", "votes", "answers"].includes(sortBy)) {
      throw new BadRequestError("Invalid 'sortBy' parameter.");
    }
    if (!["asc", "desc"].includes(order)) {
      throw new BadRequestError("Invalid 'order' parameter.");
    }

    // 3. Call Service Function
    const result = await listQuestions({ page, limit, sortBy, order, tagName });

    // 4. Success Response
    return respondSuccess(result);
  } catch (error: any) {
    // 5. Centralized Error Handling
    if (error instanceof BadRequestError)
      return respondBadRequest(error.message);
    console.error("[API GET /api/questions] Error:", error);
    return respondError("Failed to fetch questions.");
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

// app/api/kudos/categories/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust path to your prisma client
import {
  BadRequestError,
  ForbiddenError,
  respondBadRequest,
  respondError,
  respondForbidden,
  respondSuccess,
  respondUnauthorized,
} from "@/lib/api/responses"; // Adjust path to your response utils
import {
  CategorySchema,
  createKudosCategory,
  listKudosCategories,
} from "@/services/categoryService";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { ZodError } from "zod";
import { UserRole } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const categories = await listKudosCategories(); // Use the service function
    return respondSuccess(categories);
  } catch (error) {
    console.error("[API GET /api/kudos/categories] Error:", error);
    return respondError("Failed to fetch appreciation categories.");
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authentication & Authorization
    const user = await getCurrentUser();
    if (!user) return respondUnauthorized();
    if (!isAdmin(user)) return respondForbidden("Admin privileges required."); // Check if user is admin

    // 2. Parse & Validate Body
    let validatedData;
    try {
      const body = await request.json();
      validatedData = CategorySchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestError(
          "Invalid category data.",
          error.flatten().fieldErrors as any
        );
      }
      throw new BadRequestError("Invalid JSON format.");
    }

    // 3. Call Service Function
    const newCategory = await createKudosCategory(validatedData);

    // 4. Success Response
    return respondSuccess(newCategory, 201); // 201 Created
  } catch (error: any) {
    // 5. Centralized Error Handling
    if (error instanceof BadRequestError)
      return respondBadRequest(error.message, error.errors);
    if (error instanceof ForbiddenError) return respondForbidden(error.message);
    // Handle other potential errors (like PrismaClientKnownRequestError P2002 for unique constraint)
    console.error("[API POST /api/kudos/categories] Error:", error);
    return respondError("Failed to create category.");
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
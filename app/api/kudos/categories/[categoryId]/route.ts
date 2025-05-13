// app/api/kudos/categories/[categoryId]/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  CategorySchema,
  deleteKudosCategory,
  updateKudosCategory,
} from "@/services/categoryService"; // Import service & schema
import { getCurrentUser, isAdmin } from "@/lib/auth"; // Your auth functions
import {
  respondError,
  respondSuccess,
  respondUnauthorized,
  respondForbidden,
  respondBadRequest,
  respondNotFound,
  BadRequestError,
  NotFoundError,
  ForbiddenError, // Import helpers & errors
} from "@/lib/api/responses";
import { Prisma } from "@prisma/client";

// Define partial schema for updates (all fields optional)
const CategoryUpdateSchema = CategorySchema.partial();

export async function PUT(
  request: Request,
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;

  try {
    // 1. Authentication & Authorization
    const user = await getCurrentUser();
    if (!user) return respondUnauthorized();
    if (!isAdmin(user)) return respondForbidden("Admin privileges required.");

    // 2. Validate Category ID
    if (!categoryId) throw new BadRequestError("Category ID is required.");

    // 3. Parse & Validate Body
    let validatedData;
    try {
      const body = await request.json();
      // Use partial schema for updates
      validatedData = CategoryUpdateSchema.parse(body);
      // Ensure at least one field is being updated
      if (Object.keys(validatedData).length === 0) {
        throw new BadRequestError("No fields provided for update.");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new BadRequestError(
          "Invalid category data.",
          error.flatten().fieldErrors as any
        );
      }
      throw new BadRequestError("Invalid JSON format.");
    }

    // 4. Call Service Function
    const updatedCategory = await updateKudosCategory(
      categoryId,
      validatedData
    );

    // 5. Success Response
    return respondSuccess(updatedCategory);
  } catch (error: any) {
    // 6. Centralized Error Handling
    if (error instanceof BadRequestError)
      return respondBadRequest(error.message, error.errors);
    if (error instanceof ForbiddenError) return respondForbidden(error.message);
    if (error instanceof NotFoundError) return respondNotFound(error.message);
    // Handle other potential errors
    console.error(
      `[API PUT /api/kudos/categories/${categoryId}] Error:`,
      error
    );
    return respondError("Failed to update category.");
  }
}

export async function DELETE(
    request: Request, // Not used, but part of signature
    { params }: { params: { categoryId: string } }
) {
    const { categoryId } = params;

    try {
        // 1. Authentication & Authorization
        const user = await getCurrentUser();
        if (!user) return respondUnauthorized();
        if (!isAdmin(user)) return respondForbidden("Admin privileges required.");

        // 2. Validate Category ID
        if (!categoryId) throw new BadRequestError("Category ID is required.");

        // 3. Call Service Function
        await deleteKudosCategory(categoryId);

        // 4. Success Response (204 No Content)
        return new NextResponse(null, { status: 204 });

    } catch (error: any) {
        // 5. Centralized Error Handling
        if (error instanceof ForbiddenError) return respondForbidden(error.message);
        if (error instanceof NotFoundError) return respondNotFound(error.message);
        // Handle potential constraint errors if onDelete was set to Restrict
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
             return respondBadRequest("Cannot delete category because it is currently linked to existing Kudos records.");
        }
        console.error(`[API DELETE /api/kudos/categories/${categoryId}] Error:`, error);
        return respondError("Failed to delete category.");
    }
}
// app/api/admin/badges/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { listAllBadges, createBadge, CreateBadgeSchema } from '@/services/adminService'; // Adjust path
import { respondSuccess, respondError, respondForbidden, respondBadRequest, respondConflict, ApiError, BadRequestError, ConflictError, ForbiddenError } from '@/lib/api/responses';
import { z, ZodError } from 'zod';

// GET - List all badges
export async function GET(request: Request) {
    try {
        const adminUser = await getCurrentUser();
        if (!adminUser || adminUser.role !== UserRole.ADMIN) return respondForbidden();
        const badges = await listAllBadges();
        return respondSuccess(badges);
    } catch (error: any) { /* ... error handling ... */ return respondError("Failed to fetch badges."); }
}

// POST - Create a new badge
export async function POST(request: Request) {
    try {
        const adminUser = await getCurrentUser();
        if (!adminUser || adminUser.role !== UserRole.ADMIN) return respondForbidden();

        let validatedBody: z.infer<typeof CreateBadgeSchema>;
        try {
            const body = await request.json();
            validatedBody = CreateBadgeSchema.parse(body);
        } catch (e) {
            if (e instanceof ZodError) throw new BadRequestError("Validation failed.", e.flatten().fieldErrors as any);
            if (e instanceof SyntaxError) throw new BadRequestError("Invalid JSON format.");
            throw e;
        }

        const newBadge = await createBadge(validatedBody);
        return respondSuccess(newBadge, 201);

    } catch (error: any) {
        if (error instanceof ConflictError) return respondConflict(error.message);
        if (error instanceof BadRequestError) return respondBadRequest(error.message, error.errors);
        if (error instanceof ForbiddenError) return respondForbidden(error.message);
        console.error("[API POST /api/admin/badges] Error:", error);
        return respondError("Failed to create badge.");
    }
}
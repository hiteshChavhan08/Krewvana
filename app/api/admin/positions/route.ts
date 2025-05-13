// app/api/admin/positions/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { createPosition, listAllPositions, CreatePositionSchema } from '@/services/adminService'; // Adjust path
import { respondSuccess, respondError, respondForbidden, respondBadRequest, respondConflict, ApiError, BadRequestError, ConflictError, ForbiddenError } from '@/lib/api/responses';
import { z, ZodError } from 'zod';

// GET - List all positions (for Admin UI)
export async function GET(request: Request) {
    try {
        // 1. Auth & Authz
        const adminUser = await getCurrentUser();
        if (!adminUser || adminUser.role !== UserRole.ADMIN) {
            return respondForbidden("Admin privileges required.");
        }

        // 2. Call Service
        const positions = await listAllPositions();

        // 3. Respond
        return respondSuccess(positions);

    } catch (error: any) {
        console.error("[API GET /api/admin/positions] Error:", error);
        return respondError("Failed to fetch positions.");
    }
}


// POST - Create a new position
export async function POST(request: Request) {
    try {
        // 1. Auth & Authz
        const adminUser = await getCurrentUser();
        if (!adminUser || adminUser.role !== UserRole.ADMIN) {
            return respondForbidden("Admin privileges required.");
        }

        // 2. Validate Request Body
        let validatedBody: z.infer<typeof CreatePositionSchema>;
        try {
            const body = await request.json();
            const validation = CreatePositionSchema.safeParse(body);
            if (!validation.success) {
                throw new BadRequestError("Invalid request body.", validation.error.flatten().fieldErrors as any);
            }
            validatedBody = validation.data;
        } catch (e) {
            if (e instanceof SyntaxError) throw new BadRequestError("Invalid JSON format.");
            if (e instanceof BadRequestError) throw e;
            if (e instanceof z.ZodError) { throw new BadRequestError("Validation failed.", e.flatten().fieldErrors as any) }
            throw new Error("Failed to parse request body.");
        }

        // 3. Call Service
        const newPosition = await createPosition(validatedBody);

        // 4. Respond
        return respondSuccess(newPosition, 201); // 201 Created

    } catch (error: any) {
        if (error instanceof ConflictError) return respondConflict(error.message);
        if (error instanceof BadRequestError) return respondBadRequest(error.message, error.errors);
        if (error instanceof ForbiddenError) return respondForbidden(error.message);
        if (error instanceof ApiError) return NextResponse.json({ message: error.message }, { status: error.status });

        console.error("[API POST /api/admin/positions] Error:", error);
        return respondError("Failed to create position.");
    }
}
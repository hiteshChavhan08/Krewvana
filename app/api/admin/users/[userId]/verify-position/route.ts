// app/api/admin/users/[userId]/verify-position/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { updateUserPositionVerification, VerifyPositionPayload } from '@/services/adminService'; // Adjust path
import { respondSuccess, respondError, respondForbidden, respondBadRequest, respondNotFound, ApiError, BadRequestError, NotFoundError, ForbiddenError } from '@/lib/api/responses';
import { z } from 'zod';

// Simple schema for the PUT request body
const VerifySchema = z.object({
    isVerified: z.boolean()
}).strict();

// Params type inferred by Next.js
interface RouteParams { params: { userId: string } }

export async function PUT(request: Request, { params }: RouteParams ) {
    try {
        // 1. Authentication & Authorization
        const adminUser = await getCurrentUser();
        if (!adminUser || adminUser.role !== UserRole.ADMIN) {
            return respondForbidden("Admin privileges required.");
        }

        // 2. Get Target User ID from route params
        const { userId: targetUserId } = params;
        if (!targetUserId) {
            throw new BadRequestError("Target User ID is required in the URL path.");
        }

        // 3. Validate Request Body
        let validatedBody: VerifyPositionPayload;
         try {
            const body = await request.json();
            const validation = VerifySchema.safeParse(body);
            if (!validation.success) {
                throw new BadRequestError("Invalid request body.", validation.error.flatten().fieldErrors as any);
            }
            validatedBody = validation.data;
        } catch (e) {
            if (e instanceof SyntaxError) throw new BadRequestError("Invalid JSON format.");
            if (e instanceof BadRequestError) throw e;
            throw new Error("Failed to parse request body.");
        }

        // 4. Call Service
        const result = await updateUserPositionVerification(targetUserId, validatedBody);

        // 5. Respond
        return respondSuccess(result); // Return minimal success data

    } catch (error: any) {
        if (error instanceof BadRequestError) return respondBadRequest(error.message, error.errors);
        if (error instanceof NotFoundError) return respondNotFound(error.message);
        if (error instanceof ForbiddenError) return respondForbidden(error.message);
        if (error instanceof ApiError) return NextResponse.json({ message: error.message }, { status: error.status });

        console.error(`[API PUT /api/admin/users/${params.userId}/verify-position] Error:`, error);
        return respondError("Failed to update position verification.");
    }
}
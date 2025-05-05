// app/api/admin/users/[userId]/role/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { updateUserRole, UpdateUserRoleSchema } from '@/services/adminService'; // Adjust path
import { respondSuccess, respondError, respondForbidden, respondBadRequest, respondNotFound, ApiError, BadRequestError, NotFoundError, ForbiddenError } from '@/lib/api/responses';
import { z, ZodError } from 'zod';

interface RouteParams { params: { userId: string } }

// PUT - Update user role
export async function PUT(request: Request, { params }: RouteParams ) {
    try {
        const adminUser = await getCurrentUser();
        if (!adminUser || adminUser.role !== UserRole.ADMIN) return respondForbidden();

        const { userId: targetUserId } = params;
        if (!targetUserId) throw new BadRequestError("Target User ID required.");

        // Prevent admin from changing their own role via this endpoint
        if (adminUser.id === targetUserId) {
            throw new BadRequestError("Admins cannot change their own role via this interface.");
        }

        let validatedBody: z.infer<typeof UpdateUserRoleSchema>;
         try {
            const body = await request.json();
            validatedBody = UpdateUserRoleSchema.parse(body);
        } catch (e) {
            if (e instanceof ZodError) throw new BadRequestError("Validation failed.", e.flatten().fieldErrors as any);
            if (e instanceof SyntaxError) throw new BadRequestError("Invalid JSON format.");
            throw e;
        }

        const result = await updateUserRole(targetUserId, validatedBody);
        return respondSuccess(result);

    } catch (error: any) {
         if (error instanceof BadRequestError) return respondBadRequest(error.message, error.errors);
         if (error instanceof NotFoundError) return respondNotFound(error.message);
         if (error instanceof ForbiddenError) return respondForbidden(error.message);
         console.error(`[API PUT /api/admin/users/${params.userId}/role] Error:`, error);
        return respondError("Failed to update user role.");
    }
}
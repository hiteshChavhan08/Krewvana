// app/api/admin/users/pending-positions/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { listPendingVerificationUsers } from '@/services/adminService'; // Adjust path
import { respondSuccess, respondError, respondForbidden, respondBadRequest, ApiError, BadRequestError } from '@/lib/api/responses';

export async function GET(request: Request) {
    try {
        // 1. Authentication & Authorization
        const adminUser = await getCurrentUser();
        if (!adminUser || adminUser.role !== UserRole.ADMIN) {
            return respondForbidden("Admin privileges required.");
        }

        // 2. Parse Query Params (Pagination)
        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get('limit');
        const pageParam = searchParams.get('page');
        const page = pageParam ? parseInt(pageParam, 10) : 1;
        const limit = limitParam ? parseInt(limitParam, 10) : 20;
        if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > 100) {
            throw new BadRequestError("Invalid pagination parameters.");
        }

        // 3. Call Service
        const result = await listPendingVerificationUsers(limit, page);

        // 4. Respond
        // Return data in a structure expected by the client (e.g., including pagination)
         return respondSuccess({
            data: result.data,
            pagination: {
                page,
                limit,
                totalCount: result.totalCount,
                totalPages: Math.ceil(result.totalCount / limit)
            }
         });

    } catch (error: any) {
        if (error instanceof BadRequestError) return respondBadRequest(error.message);
        if (error instanceof ApiError) return NextResponse.json({ message: error.message }, { status: error.status });
        console.error("[API GET /api/admin/users/pending-positions] Error:", error);
        return respondError("Failed to fetch users pending verification.");
    }
}
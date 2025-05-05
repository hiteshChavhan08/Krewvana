// app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { listAllUsersAdmin } from '@/services/adminService'; // Adjust path
import { respondSuccess, respondError, respondForbidden, respondBadRequest, ApiError, BadRequestError, ForbiddenError } from '@/lib/api/responses';

// GET - List all users for admin view
export async function GET(request: Request) {
    try {
        const adminUser = await getCurrentUser();
        if (!adminUser || adminUser.role !== UserRole.ADMIN) return respondForbidden();

        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get('limit');
        const pageParam = searchParams.get('page');
        const searchTerm = searchParams.get('search');
        const page = pageParam ? parseInt(pageParam, 10) : 1;
        const limit = limitParam ? parseInt(limitParam, 10) : 20; // Default limit
        if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > 100) {
            throw new BadRequestError("Invalid pagination parameters.");
        }

        const result = await listAllUsersAdmin(limit, page, searchTerm);
         return respondSuccess({ // Return paginated structure
            data: result.data,
            pagination: { page, limit, totalCount: result.totalCount, totalPages: Math.ceil(result.totalCount / limit) }
         });

    } catch (error: any) {
         if (error instanceof BadRequestError) return respondBadRequest(error.message);
         if (error instanceof ForbiddenError) return respondForbidden(error.message);
         console.error("[API GET /api/admin/users] Error:", error);
        return respondError("Failed to fetch users.");
    }
}
// app/api/skills/route.ts
import { respondSuccess, respondError, respondBadRequest, BadRequestError, respondUnauthorized } from '@/lib/api/responses';
import { searchSkills } from '@/services/metaService'; // Adjust path
import { getCurrentUser } from '@/lib/auth'; // Require auth?

export async function GET(request: Request) {
    try {
        // Optional: Check if user is authenticated
         const user = await getCurrentUser();
         if (!user) return respondUnauthorized();

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('search');
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam, 10) : 10;

        if (!query) {
             // Return empty or potentially popular skills if no query
             return respondSuccess([]);
        }
        if (isNaN(limit) || limit < 1 || limit > 50) {
             throw new BadRequestError("Invalid limit parameter.");
        }

        const skills = await searchSkills(query, limit);
        return respondSuccess(skills);

    } catch (error: any) {
         if (error instanceof BadRequestError) return respondBadRequest(error.message);
         console.error("[API GET /api/skills] Error:", error);
        return respondError("Failed to search skills.");
    }
}
// app/api/positions/route.ts
import { respondSuccess, respondError, respondUnauthorized } from '@/lib/api/responses';
import { listPositions } from '@/services/metaService'; // Adjust path
import { getCurrentUser } from '@/lib/auth'; // Require auth to see positions?

export async function GET(request: Request) {
    try {
         // Optional: Check if user is authenticated to view positions
         const user = await getCurrentUser();
         if (!user) return respondUnauthorized(); // Or allow public access

         const positions = await listPositions();
         return respondSuccess(positions);
    } catch (error: any) {
        console.error("[API GET /api/positions] Error:", error);
        return respondError("Failed to fetch positions.");
    }
}
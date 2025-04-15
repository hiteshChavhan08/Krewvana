// lib/session.ts (or similar utility file)
import { getServerSession as getNextAuthServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed

export async function getServerSession() {
    // Pass your NextAuth options object to ensure consistency
    return await getNextAuthServerSession(authOptions);
}

// Helper to quickly get user ID or throw error/return null if not authenticated
export async function getAuthenticatedUserId(): Promise<string | null> {
    const session = await getServerSession();
    if (!session?.user?.id) {
        // Decide whether to return null or throw an error based on context
        // For API routes, returning null and handling it there is often better
        console.warn("getAuthenticatedUserId: No authenticated user found in session.");
        return null;
    }
    return session.user.id;
}

// Helper to check if user has a specific role (example)
export async function hasRole(role: string): Promise<boolean> {
    const session = await getServerSession();
    return session?.user?.role === role;
}
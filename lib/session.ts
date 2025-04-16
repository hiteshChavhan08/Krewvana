// lib/session.ts
import { getServerSession as getNextAuthServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import { Role, User } from "@prisma/client"; // Import Role enum

// Gets the full session object
export async function getServerSession() {
    return await getNextAuthServerSession(authOptions);
}

// Gets the user ID or null if not authenticated
export async function getAuthenticatedUserId(): Promise<string | null> {
    const session = await getServerSession();
    return session?.user?.id ?? null;
}

// Gets the user's platform role or null
export async function getAuthenticatedUserRole(): Promise<Role | null> {
    const session = await getServerSession();
    // Ensure Role enum values match strings potentially returned if using JWT strategy earlier
    const roleString = session?.user?.role as keyof typeof Role | undefined;
    return roleString && Role[roleString] ? Role[roleString] : null;
}

// Helper to check if user has AT LEAST one of the specified platform roles
export async function hasRequiredPlatformRole(requiredRoles: Role[]): Promise<boolean> {
    const userRole = await getAuthenticatedUserRole();
    return userRole !== null && requiredRoles.includes(userRole);
}

// Example: Check if user is ADMIN or MANAGER
// const isAdminOrManager = await hasRequiredPlatformRole([Role.ADMIN, Role.MANAGER]);
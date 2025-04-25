//  lib/auth.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import { prisma } from '@/lib/prisma';
import { User, UserRole } from "@prisma/client"; // Import UserRole

// Define the return type explicitly to include the role
type CurrentUserWithRole = User | null; // Or be more specific: Omit<User, 'passwordHash'> | null

export async function getCurrentUser(): Promise<CurrentUserWithRole> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    console.log("getCurrentUser: No session or email found");
    return null;
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      // *** Ensure 'role' is included in the select or is fetched by default ***
      // If you use 'select', you MUST include 'role':
      // select: { id: true, name: true, email: true, image: true, role: true, points: true /* other needed fields */ }
    });

    if (!currentUser) {
      console.log(`getCurrentUser: User not found for email: ${session.user.email}`);
      return null;
    }

    return currentUser;

  } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
  }
}
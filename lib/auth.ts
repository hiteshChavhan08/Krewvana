// lib/auth.ts (or your next-auth config file)
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route" // Adjust path if needed
import { User } from "@prisma/client"
import prisma from '@/lib/prisma';

export async function getCurrentUser(): Promise<User | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!currentUser) {
    return null;
  }

  return currentUser;
}
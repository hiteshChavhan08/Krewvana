// types/next-auth.d.ts
import NextAuth, { type DefaultSession, type DefaultUser } from "next-auth";
import { type JWT, type DefaultJWT } from "next-auth/jwt";

// Define your user role enum if you have one
// import { UserRole } from "@prisma/client"; // Example if using Prisma enum

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's database id. */
      id: string;
      role: UserRole; // Add custom fields like role
    } & DefaultSession["user"]; // Keep the default fields
  }
  interface User extends DefaultUser { // Extend the default User type
    role: UserRole; // Add the role property
    // You can add other custom fields from your Prisma User model here if needed
    // by authorize or OAuth profiles (e.g., points: number;)
  }
  // If you need to add properties directly to the User model used by NextAuth internally (less common for session)
  // interface User extends DefaultUser {
  //   role: UserRole;
  // }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    role: UserRole;
  }
}

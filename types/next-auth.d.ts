// types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"
// import { Role } from "@prisma/client" // Import later when Role is added

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      // role: Role; // Add role later
    } & DefaultSession["user"];
  }
  interface User extends DefaultUser {
     id: string;
    // role: Role; // Add role later
  }
}
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string; // Use id to match session user structure easier
    // role: Role; // Add role later
    // Note: `sub` is still the standard JWT field for user ID
  }
}
// types/next-auth.d.ts (Recommended location)
import { Role } from "@prisma/client"; // Import your Role enum
import type { DefaultSession, User as DefaultUser } from "next-auth";

declare module "next-auth" {
    /**
     * Extends the built-in session.user type
     */
    interface Session {
        user: {
            /** The user's unique ID from the database */
            id: string; // Explicitly string
            /** The user's platform role */
            role: Role; // Use the Role enum type
             // Include other default properties by merging with DefaultSession["user"]
        } & DefaultSession["user"]; // This includes name, email, image?
    }

    /**
     * Extends the built-in User type (optional but good practice)
     */
    interface User extends DefaultUser {
         role: Role;
    }
}

// Ensure JWT extension is also correct
 declare module "next-auth/jwt" {
    /** Returned by the `jwt` callback */
    interface JWT {
        userId: string;
        role: Role;
         // You might have other properties here from the jwt callback
    }
}
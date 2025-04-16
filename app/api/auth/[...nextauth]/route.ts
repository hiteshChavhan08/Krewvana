// app/api/auth/[...nextauth]/route.ts
import NextAuth, {
  type NextAuthOptions,
  type User as NextAuthUser,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod"; // Make sure Zod is imported

// import { Role } from '@prisma/client';
// Type extensions ... (keep as before)
declare module "next-auth" {
  /* ... */
}
declare module "next-auth/jwt" {
  /* ... */
}

// --- Define the login schema HERE ---
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password cannot be empty" }), // Or just z.string()
});
// --- End schema definition ---

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as PrismaClient),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // 1. Validate credentials using the defined schema
        const validatedCredentials = loginSchema.safeParse(credentials);

        // 2. Check if validation failed
        if (!validatedCredentials.success) {
          console.error(
            "Login validation failed:",
            validatedCredentials.error.flatten()
          );
          return null; // Return null if validation fails
        }

        // 3. Destructure **AFTER** the successful validation check
        //    TypeScript should now correctly infer the type of validation.data
        const { email, password } = validatedCredentials.data;

        // 4. Fetch user and compare password (your existing logic)
        try {
          const user = await prisma.user.findUnique({ where: { email } });

          if (!user || !user.passwordHash) {
            console.log(
              `Authorize: User not found or no password for ${email}`
            );
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            password,
            user.passwordHash
          );

          if (!passwordMatch) {
            console.log(`Authorize: Invalid password for ${email}`);
            return null;
          }

          console.log(`Authorize: Success for ${email}`);
          // Return user object including role
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          };
        } catch (dbError) {
          console.error("Authorize DB Error:", dbError);
          return null; // Return null on database errors during authorization
        }
      },
    }),
    // ... other providers ...
  ],

  session: {
    strategy: "jwt", // Keep JWT strategy
    // ... maxAge, updateAge
  },

  callbacks: {
    // ... jwt and session callbacks as defined previously ...
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id; // user.id from authorize is string
        token.role = user.role ?? Role.USER; // user.role from authorize is Role or null
      }
      return token;
    },
    async session({ session, token }) {
      // Problem Area: Ensure types match between token and session.user extension

      // Check if session.user exists (it should based on DefaultSession)
      if (session.user) {
        // Explicitly check if token properties exist before assigning
        if (token?.userId && typeof token.userId === "string") {
          session.user.id = token.userId; // Assign string to string
        }
        if (
          token?.role &&
          typeof token.role === "string" &&
          Role[token.role as keyof typeof Role]
        ) {
          // Assign Role enum value to Role enum property
          session.user.role = token.role as Role;
        } else {
          // Assign a default role if not found on token, or handle error
          session.user.role = Role.USER; // Or potentially throw error/log issue
        }

        // Handle standard properties if necessary (usually included by DefaultSession)
        // session.user.name = token.name as string | null | undefined;
        // session.user.email = token.email as string | null | undefined;
        // session.user.image = token.image as string | null | undefined;
      } else {
        // This case should ideally not happen if using DefaultSession correctly
        console.error(
          "Session object missing 'user' property in session callback."
        );
      }

      return session;
    },
  },

  pages: { signIn: "/login" },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

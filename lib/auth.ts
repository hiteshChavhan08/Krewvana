// lib/auth.ts
import NextAuth, {
  type NextAuthOptions,
  type User,
  type Session,
} from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getServerSession as nextAuthGetServerSession } from "next-auth/next"; // Import core function
import { UserRole } from "@prisma/client";

// Your types/next-auth.d.ts should augment Session['user'] with 'id'
// import { UserRole } from "@prisma/client"; // Example

type Credentials = Record<"email" | "password", string> | undefined;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        console.log(
          "[Authorize] Attempting authorization for:",
          credentials?.email
        );
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            passwordHash: true,
            role: true,
          },
        });
        // console.log(
        //   "[Authorize] User found in DB:",
        //   user ? { id: user.id, email: user.email, role: user.role } : null
        // );
        if (!user || !user.passwordHash) {
          return null;
        }
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isValidPassword) {
          return null;
        }
        // Important: Return only fields needed for JWT/Session initially
        // The 'id' is crucial here for the callbacks
        const userToReturn = {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role, // Ensure this is correct
        };
        // console.log(
        //   "[Authorize] Returning user object:",
        //   JSON.stringify(userToReturn, null, 2)
        // );
        return userToReturn;
      },
    }),
    // Add other providers later
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      // console.log(
      //   "[JWT Callback] Trigger: (Not checking trigger for this debug)"
      // );
      // console.log("[JWT Callback] Initial Token:", JSON.stringify(token));
      // console.log("[JWT Callback] User object present:", !!user);

      // --- Always try to fetch role if token has a user ID (sub) ---
      if (token.sub) {
        // console.log(
        //   `[JWT Callback] Token has sub (user ID): ${token.sub}. Attempting DB fetch for role.`
        // );
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub }, // Use ID from token subject
            select: { role: true },
          });
          // console.log(
          //   `[JWT Callback] Role fetched from DB for ${token.sub}: ${dbUser?.role}`
          // );

          if (dbUser?.role) {
            token.role = dbUser.role;
          } else {
            // Role not found in DB for this ID, assign default
            // console.warn(
            //   `[JWT Callback] Role NOT found in DB for user ID: ${token.sub}. Assigning default USER role.`
            // );
            token.role = UserRole.USER;
          }
        } catch (dbError) {
          // console.error(
          //   "[JWT Callback] Error fetching user role from DB:",
          //   dbError
          // );
          token.role = UserRole.USER; // Fallback on DB error
        }
      } else if (user?.id) {
        // Fallback for initial sign-in if token.sub isn't set yet (should be rare)
        // console.log(
        //   `[JWT Callback] Initial sign-in detected (user object present), using user.role: ${user.role}`
        // );
        token.sub = user.id; // Ensure sub is set
        token.role = user.role as UserRole; // Trust role from authorize/profile if sub wasn't in token yet
      } else {
        // console.warn(
        //   "[JWT Callback] Token has no 'sub' and no 'user' object present. Cannot determine role."
        // );
        // Assign default if role isn't already set
        if (!token.role) token.role = UserRole.USER;
      }

      // console.log(
      //   "[JWT Callback] Final Token being returned:",
      //   JSON.stringify(token)
      // );
      return token;
    },
    async session({ session, token }) {
      // console.log("[Session Callback] Token received:", JSON.stringify(token));

      // Defensive check: Ensure token and session.user exist
      if (token && session.user) {
        // Assign ID from token 'sub' claim
        session.user.id = token.sub ?? session.user.id; // Use sub if available

        // Assign Role from token 'role' claim
        if (token.role) {
          session.user.role = token.role as UserRole;
          // console.log(
          //   `[Session Callback] Assigned role '${token.role}' to session.user`
          // );
        } else {
          // This case should be less likely if JWT callback ensures role exists
          // console.error(
          //   `[Session Callback] CRITICAL: Role missing from token for user ID: ${token.sub}. Session will lack role.`
          // );
          // Assign a default role here if necessary for type safety downstream,
          // but log aggressively as it indicates a problem in the JWT callback.
          session.user.role = UserRole.USER; // Assign default as fallback
        }
      } else {
        // console.warn(
        //   "[Session Callback] Token or session.user was null/undefined. Cannot populate session fully."
        // );
      }

      // console.log(
      //   "[Session Callback] Final Session being returned:",
      //   JSON.stringify(session)
      // );
      return session;
    },
  },
  pages: { signIn: "/auth/signin" },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

// --- Server-Side Session Utilities ---

/**
 * Retrieves the full session object on the server side.
 * Use this in Route Handlers, Server Actions, Server Components.
 * @returns {Promise<Session | null>} The session object or null if not authenticated.
 */
// --- Server-Side Session Utilities ---
export const getCurrentSession = async (): Promise<Session | null> => {
  // console.log("[getCurrentSession] Attempting to fetch session...");
  const session = await nextAuthGetServerSession(authOptions);
  // console.log(
  //   "[getCurrentSession] Fetched session:",
  //   session
  //     ? `User ID: ${session.user?.id}, Role: ${session.user?.role}`
  //     : "null"
  // );
  return session;
};

/**
 * Retrieves the authenticated user object from the session on the server side.
 * Use this in Route Handlers, Server Actions, Server Components.
 * Ensures type safety based on your augmented Session interface.
 * @returns {Promise<Session['user'] | null>} The user object or null if not authenticated.
 */
export const getCurrentUser = async (): Promise<Session["user"] | null> => {
  // console.log("[getCurrentUser] Calling getCurrentSession...");
  const session = await getCurrentSession();
  const user = session?.user ?? null;
  // console.log(
    // "[getCurrentUser] Returning user object:",
    // user ? `ID: ${user.id}, Role: ${user.role}` : "null"
  // );
  return user;
};

// --- Re-export NextAuth handlers ---
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

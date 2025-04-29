// lib/auth.ts
import NextAuth, { type NextAuthOptions, type User, type Session } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { getServerSession as nextAuthGetServerSession } from "next-auth/next" // Import core function

// Your types/next-auth.d.ts should augment Session['user'] with 'id'
// import { UserRole } from "@prisma/client"; // Example

type Credentials = Record<"email" | "password", string> | undefined;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) { return null; }
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.passwordHash) { return null; }
        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValidPassword) { return null; }
        // Important: Return only fields needed for JWT/Session initially
        // The 'id' is crucial here for the callbacks
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          // Do NOT return passwordHash here!
          // role: user.role, // Include role if needed in JWT/session
        };
      },
    }),
    // Add other providers later
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, persist the user id (and role) to the token
      if (user) {
        token.sub = user.id; // 'sub' is standard JWT claim for subject (user ID)
        // if (user.role) token.role = user.role; // Add role if available on User object from authorize
      }
      return token;
    },
    async session({ session, token }) {
      // Add properties from the JWT token (like id and role) to the session object
      if (session.user && token.sub) {
        session.user.id = token.sub; // Add id from token.sub
        // if (token.role) session.user.role = token.role as UserRole; // Add role from token
      }
      return session;
    },
  },
  pages: { signIn: '/auth/signin' },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

// --- Server-Side Session Utilities ---

/**
 * Retrieves the full session object on the server side.
 * Use this in Route Handlers, Server Actions, Server Components.
 * @returns {Promise<Session | null>} The session object or null if not authenticated.
 */
export const getCurrentSession = async (): Promise<Session | null> => {
  // Use the renamed import to avoid conflict with our function name
  return await nextAuthGetServerSession(authOptions);
};

/**
 * Retrieves the authenticated user object from the session on the server side.
 * Use this in Route Handlers, Server Actions, Server Components.
 * Ensures type safety based on your augmented Session interface.
 * @returns {Promise<Session['user'] | null>} The user object or null if not authenticated.
 */
export const getCurrentUser = async (): Promise<Session['user'] | null> => {
  const session = await getCurrentSession();
  // Ensure you return null if session or session.user is null/undefined
  return session?.user ?? null;
};


// --- Re-export NextAuth handlers ---
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
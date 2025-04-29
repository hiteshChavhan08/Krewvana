// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions, type User } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma"; // Use the singleton

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
      async authorize(credentials: Credentials, req): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.passwordHash) {
          return null;
        } // No user or no password hash
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isValidPassword) {
          return null;
        }
        // Return necessary fields matching NextAuth User type
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
    // Add other providers later if needed
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }) {
      // token contains the data added in the jwt callback
      if (session.user) {
        session.user.id = token.sub; // Use 'sub' which holds the ID
        // session.user.role = token.role as UserRole; // Assign role, potentially cast type
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // User is available on initial sign in
        token.sub = user.id; // Already have this
        // Assuming your Prisma user model has a 'role' field
        // You might need to fetch the user from DB again if 'user' object doesn't have role
        // const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        // if (dbUser) {
        //    token.role = dbUser.role;
        // }
      }
      return token;
    },
  },
  pages: { signIn: "/auth/signin" },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

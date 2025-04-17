// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions, type User } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma'; // Use the singleton

type Credentials = Record<"email" | "password", string> | undefined;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: Credentials, req): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) { return null; }
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.passwordHash) { return null; } // No user or no password hash
        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValidPassword) { return null; }
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
  session: { strategy: 'jwt' },
  callbacks: {
    async session({ session, token }) { // Add 'token'
      if (session.user && token.sub) { // Use token.sub for JWT ID
        session.user.id = token.sub;
        // session.user.role = token.role; // Add role later
      }
      return session;
    },
    async jwt({ token, user }) { // Add 'user'
      if (user) { // User object is available on sign-in/sign-up
        token.sub = user.id;
        // token.role = user.role; // Add role later
      }
      return token;
    },
  },
  pages: { signIn: '/auth/signin' },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
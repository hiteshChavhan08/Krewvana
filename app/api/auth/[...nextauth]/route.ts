// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions, type User as NextAuthUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client'; // Use direct import here or your singleton
import { prisma } from '@/lib/prisma'; // Using the singleton instance
import bcrypt from 'bcrypt';
import { z } from 'zod';

// Extend the NextAuth User and Session types to include id and role
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string; // Assuming 'role' is a string enum in your Prisma schema
    } & NextAuthUser; // Keep existing fields like name, email, image
  }

  // interface User {
  //     role?: string | null; // Add role to the User type recognized by NextAuth
  // }
}

declare module 'next-auth/jwt' {
    interface JWT {
        userId: string;
        role: string;
    }
}


export const authOptions: NextAuthOptions = {
  // Use the Prisma adapter
  adapter: PrismaAdapter(prisma as PrismaClient), // Cast necessary if using singleton type wrappers

  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: 'Credentials',
      // `credentials` is used to generate a form on the sign-in page.
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'jsmith@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        // Add logic here to look up the user from the credentials supplied
        const loginSchema = z.object({
          email: z.string().email(),
          password: z.string(),
        });

        const validatedCredentials = loginSchema.safeParse(credentials);

        if (!validatedCredentials.success) {
            console.error("Login validation failed:", validatedCredentials.error);
            // Optionally throw specific error types or return null
            // throw new Error("Invalid credentials format.");
            return null;
        }

        const { email, password } = validatedCredentials.data;

        const user = await prisma.user.findUnique({
          where: { email: email },
        });

        if (!user || !user.passwordHash) {
          // If you want to prevent timing attacks, hash a dummy password even if user not found
          // await bcrypt.compare("dummyPassword", "$2b$10$dummyHash"); // Example placeholder hash
          console.log(`Login attempt failed: User not found or no password set for ${email}`);
          return null; // User not found or doesn't use password auth
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatch) {
          console.log(`Login attempt failed: Invalid password for ${email}`);
          return null; // Passwords don't match
        }

        console.log(`Login successful for ${email}`);
        // Return the user object (must match structure expected by adapter/session)
        // Ensure 'role' is included if you need it in the session/JWT
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role, // Include the role
        };
      },
    }),
    // ...add more providers here (e.g., Google, GitHub) if needed
  ],

  // Use database sessions
  session: {
    strategy: 'database', // Use 'database' with adapter; 'jwt' is alternative
    // strategy: 'jwt' // If you prefer JWT sessions
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  // Callbacks are asynchronous functions you can use to control what happens
  // when an action is performed.
  callbacks: {
    // async jwt({ token, user, account, profile, isNewUser }) {
    //   // This callback is only used if session strategy is 'jwt'
    //   if (user) { // 'user' is available on sign-in
    //     token.userId = user.id;
    //     token.role = user.role || 'USER'; // Assign role from user object
    //   }
    //   return token;
    // },

    async session({ session, user, token }) {
      // This callback runs for both 'database' and 'jwt' strategies.
      // 'user' object comes from the adapter/database for 'database' strategy.
      // 'token' object comes from the jwt callback for 'jwt' strategy.

       // For database sessions, the 'user' object passed is the user from the DB.
       // For JWT sessions, the 'token' object holds the JWT data.
       if (session.user) {
           session.user.id = user.id; // Add id from the DB user object
           session.user.role = user.role || 'USER'; // Add role from the DB user object
       }


      // Example for JWT strategy (uncomment if using JWT):
      // if (token && session.user) {
      //   session.user.id = token.userId;
      //   session.user.role = token.role;
      // }
      return session; // The session object returned is exposed client-side via useSession/getServerSession
    },
  },

  // Custom pages for sign-in, sign-out, error, etc. (optional)
  pages: {
    signIn: '/login', // Redirect users to /login if they need to sign in
    // signOut: '/auth/signout',
    // error: '/auth/error', // Error code passed in query string as ?error=
    // verifyRequest: '/auth/verify-request', // (used for email provider)
    // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out to disable)
  },

  // Enable debug messages in the console if you are having problems
  debug: process.env.NODE_ENV === 'development',

  secret: process.env.NEXTAUTH_SECRET, // **MUST** be set in your .env file
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
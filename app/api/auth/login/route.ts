// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
// **IMPORTANT**: Replace this with actual secure session management (e.g., next-auth, lucia-auth)
// import { createSession } from '@/lib/session'; // Placeholder for session logic

// Input validation schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1), // Basic check, actual strength check was at registration
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, password } = validation.data;

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Check if user exists and if they registered with a password
    if (!user || !user.passwordHash) {
      // Use a generic message to avoid revealing if the email exists
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // Compare the provided password with the stored hash
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // --- !!! Session Management Placeholder !!! ---
    // **Replace this entire section with your actual session library (e.g., next-auth, lucia-auth)**
    // 1. Generate a secure session token/ID.
    // 2. Store the session (if using DB sessions like next-auth adapter).
    // 3. Set a secure, httpOnly cookie with the session token.
    // Example using a placeholder function:
    // const sessionToken = await createSession(user.id); // Your function to handle session creation

    const sessionToken = `fake-session-for-${user.id}-${Date.now()}`; // **DO NOT USE IN PRODUCTION**
    console.warn('Using insecure placeholder session management in /api/auth/login');

    // Prepare user data to return (omit sensitive fields like passwordHash)
    const userToReturn = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
    };

    // Set the cookie (adjust options for production)
    const response = NextResponse.json({ user: userToReturn /* , token: sessionToken */ }); // Avoid returning token in body if using cookies
    response.cookies.set('auth_session', sessionToken, {
      httpOnly: true, // Prevent client-side JS access
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'lax', // CSRF protection
      path: '/',
      // maxAge: 60 * 60 * 24 * 7, // Example: 1 week expiry
    });
    // --- End Session Management Placeholder ---

    // Update lastLogin in Profile (optional)
    try {
        await prisma.profile.update({
            where: { userId: user.id },
            data: { lastLogin: new Date() }
        });
    } catch (profileError) {
        console.warn(`Could not update lastLogin for user ${user.id}:`, profileError);
        // Don't fail the login if this minor update fails
    }


    return response;

  } catch (error) {
    console.error('Login Error:', error);
     if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }
    return NextResponse.json({ message: 'An error occurred during login' }, { status: 500 });
  }
}
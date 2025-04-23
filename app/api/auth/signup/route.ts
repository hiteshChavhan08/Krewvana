// app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client'; // Import UserRole enum

const SALT_ROUNDS = 10; // Cost factor for bcrypt hashing

// Server-side validation schema (doesn't need confirmPassword)
const userSignupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }).max(100),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  // Add password complexity requirements if desired
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Validate Input
    const validation = userSignupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten() }, { status: 400 });
    }
    const { name, email, password } = validation.data;

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }, // Check case-insensitively if desired by DB collation, or normalize here
    });

    if (existingUser) {
      return NextResponse.json({ message: 'An account with this email already exists.' }, { status: 409 }); // 409 Conflict
    }

    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 4. Create User in Database
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(), // Store email in lowercase for consistency
        passwordHash: hashedPassword,
        role: UserRole.USER, // Default role
        // emailVerified: null, // Email not verified initially
      },
      // Select only non-sensitive fields to return
      select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
      }
    });

    // 5. Return Success Response (don't return passwordHash)
    return NextResponse.json(newUser, { status: 201 }); // 201 Created

  } catch (error) {
    console.error("Signup API Error:", error);
     if (error instanceof z.ZodError) { // Should be caught by safeParse, but belt-and-suspenders
        return NextResponse.json({ errors: error.flatten() }, { status: 400 });
      }
    // Handle potential Prisma errors (e.g., unique constraint violation if check failed somehow)
    return NextResponse.json({ message: 'An unexpected error occurred during signup.' }, { status: 500 });
  }
}
// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client'; // Import Prisma types

// Input validation schema (same as before)
const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
  name: z.string().min(1, { message: 'Name is required' }).optional(),
  // Add other fields like 'department' if needed for profile creation
  // department: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, password, name } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create the user and profile
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'USER', // Default role
        profile: {
          create: {
            points: 0,
            // department: validation.data.department || null,
          },
        },
      },
      select: { // Select fields to return (exclude passwordHash)
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        profile: { select: { id: true, points: true } }
      },
    });

    // NOTE: Registration does NOT automatically sign the user in via NextAuth here.
    // The user needs to proceed to the login page/flow after successful registration.

    return NextResponse.json(newUser, { status: 201 });

  } catch (error) {
    console.error('Registration Error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'Email already in use.' }, { status: 409 });
    }
     if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }
    return NextResponse.json({ message: 'An error occurred during registration' }, { status: 500 });
  }
}
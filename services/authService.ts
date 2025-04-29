// services/authService.ts

import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserSignupSchema } from "@/lib/schemas"; // Import the schema
import {
  ApiError,
  BadRequestError,
  ConflictError, // Using 409 Conflict
} from "@/lib/api/responses"; // Import errors

const SALT_ROUNDS = 10;

/**
 * Registers a new user.
 * Checks for existing email, hashes password, creates user record.
 * @param data - Validated user signup data (name, email, password).
 * @returns The newly created user object (excluding sensitive fields).
 * @throws ConflictError if email already exists.
 * @throws Error for other unexpected issues.
 */
export const signupUser = async (data: z.infer<typeof UserSignupSchema>) => {
  const { name, email, password } = data; // Data is already validated/transformed by schema

  // 1. Check if user already exists (using already lowercased email from schema)
  const existingUser = await prisma.user.findUnique({
    where: { email: email },
    select: { id: true }, // Only need to check existence
  });

  if (existingUser) {
    // Throw a specific error for existing user (409 Conflict)
    throw new ConflictError("An account with this email already exists.");
  }

  // 2. Hash Password
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  } catch (hashError) {
    console.error("Password Hashing Error:", hashError);
    throw new Error("Failed to secure password during signup."); // Internal error
  }

  // 3. Create User in Database
  try {
    const newUser = await prisma.user.create({
      data: {
        name,
        email, // Already lowercase
        passwordHash: hashedPassword,
        role: UserRole.USER, // Default role
        // emailVerified: null, // Set if using email verification flow
      },
      select: {
        // Select only non-sensitive fields to return
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    return newUser;
  } catch (dbError) {
    console.error("Database Error during User Creation:", dbError);
    // Handle potential unique constraint errors if the initial check failed somehow
    // Or other DB errors
    throw new Error("Failed to create user account."); // Internal error
  }
};

// Add other auth-related services here later (e.g., password reset)

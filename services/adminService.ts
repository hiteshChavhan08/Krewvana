// services/adminService.ts
import { prisma } from "@/lib/prisma";
import { Position, UserRole, type User } from "@prisma/client";
import {
  ApiError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/api/responses";
import { z } from "zod";

// Define type for user needing verification
export type PendingVerificationUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  position: { id: string; name: string } | null; // Include position details
  // Add other fields needed for display if required
};
export const CreatePositionSchema = z
  .object({
    name: z
      .string()
      .min(2, "Position name too short")
      .max(100, "Position name too long")
      .trim(),
    description: z
      .string()
      .max(500, "Description too long")
      .optional()
      .nullable(),
  })
  .strict();

type CreatePositionData = z.infer<typeof CreatePositionSchema>;
// Define type for the verification payload
export type VerifyPositionPayload = {
  isVerified: boolean; // true for approve, false for 'reject' (or un-verify)
};

/**
 * Lists users whose position is not verified but have selected one.
 * Requires ADMIN privileges.
 */
export const listPendingVerificationUsers = async (
  limit: number = 20,
  page: number = 1
): Promise<{ data: PendingVerificationUser[]; totalCount: number }> => {
  const skip = (page - 1) * limit;

  const whereClause = {
    positionId: { not: null }, // Must have a position selected
    isPositionVerified: false, // Must not be verified yet
  };

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        position: {
          // Select the related position data
          select: { id: true, name: true },
        },
      },
      orderBy: { updatedAt: "asc" }, // Show oldest pending first
      take: limit,
      skip: skip,
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  // Ensure the return type matches PendingVerificationUser[]
  const data: PendingVerificationUser[] = users;

  return { data, totalCount };
};

/**
 * Updates the verification status of a user's position.
 * Requires ADMIN privileges.
 * @param targetUserId The ID of the user whose position verification is being updated.
 * @param payload Contains the new verification status (isVerified: boolean).
 * @returns Updated user fragment (or just success indication).
 */
export const updateUserPositionVerification = async (
  targetUserId: string,
  payload: VerifyPositionPayload
): Promise<{
  id: string;
  isPositionVerified: boolean;
  positionId: string | null;
}> => {
  // 1. Check if target user exists
  const userToUpdate = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { positionId: true }, // Check if they have a position
  });

  if (!userToUpdate) {
    throw new NotFoundError("Target user");
  }
  if (!userToUpdate.positionId && payload.isVerified) {
    // Cannot verify if no position is selected
    throw new BadRequestError(
      "Cannot verify position: User has no position selected."
    );
  }

  // 2. Perform the update
  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      isPositionVerified: payload.isVerified,
      // Optionally clear position if 'rejecting' means removing the position?
      // positionId: payload.isVerified ? undefined : null
    },
    select: {
      id: true,
      isPositionVerified: true,
      positionId: true,
    },
  });

  // TODO: Maybe send a notification to the user?

  return updatedUser;
};

/**
 * Creates a new Position in the database.
 * Requires ADMIN privileges (checked by API route).
 * Ensures position name is unique (case-insensitive check).
 * @param data Validated position data (name, description).
 * @returns The newly created Position object.
 * @throws ConflictError if position name already exists.
 */
export const createPosition = async (
  data: CreatePositionData
): Promise<Position> => {
  const { name, description } = data;
  const normalizedName = name; // Keep original case for display, but check uniqueness case-insensitively

  // 1. Check for existing position (case-insensitive)
  const existingPosition = await prisma.position.findFirst({
    where: {
      name: {
        equals: normalizedName,
        mode: "insensitive", // Case-insensitive comparison
      },
    },
  });

  if (existingPosition) {
    throw new ConflictError(`A position named '${name}' already exists.`);
  }

  // 2. Create the new position
  try {
    const newPosition = await prisma.position.create({
      data: {
        name: normalizedName, // Store with original casing
        description: description,
      },
    });
    return newPosition;
  } catch (error) {
    // Handle potential DB errors during creation
    console.error("Error creating position in DB:", error);
    throw new Error("Could not create the new position.");
  }
};

/**
 * Lists all positions (useful for display in admin panel).
 */
export const listAllPositions = async (): Promise<Position[]> => {
  return prisma.position.findMany({
    orderBy: { name: "asc" },
  });
};

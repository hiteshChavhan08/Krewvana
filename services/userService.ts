// services/userService.ts

import { prisma } from "@/lib/prisma";
import { UserRole, type User } from "@prisma/client"; // Import User type and Role if needed
import { z } from "zod";
import {
  ApiError,
  BadRequestError,
  ForbiddenError,
  NotFoundError, // Import custom errors
} from "@/lib/api/responses";

// Define or import AuthenticatedUser type (ensure it has id, role, etc.)
interface AuthenticatedUser {
  id: string;
  role?: UserRole | null;
  // other fields...
}

// --- Service Functions ---

/**
 * Fetches the profile data for a given user ID.
 * Includes specific fields like badges.
 * @param userId - The ID of the user whose profile to fetch.
 * @returns The user profile data.
 * @throws NotFoundError if the user doesn't exist.
 */
export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      // Select specific fields needed for the profile view
      id: true,
      name: true,
      email: true,
      image: true,
      points: true,
      createdAt: true,
      hobbies: true,
      favoriteFood: true,
      askMeAbout: true,
      userBadges: {
        // Include related badges
        orderBy: { earnedAt: "desc" },
        select: {
          earnedAt: true,
          badge: {
            select: {
              id: true,
              name: true,
              description: true,
              iconName: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError("User");
  }
  return user;
};

/**
 * Updates the profile data for a given user.
 * Validates input against the schema.
 * @param userId - The ID of the user to update.
 * @param data - The validated data to update.
 * @returns The subset of updated user data.
 */
export const updateUserProfile = async (
  userId: string,
  data: z.infer<typeof UserProfileUpdateSchema> // Use Zod schema type
) => {
  // Data should be pre-validated by the handler using the schema

  // Prisma handles undefined fields gracefully (doesn't update them)
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      hobbies: data.hobbies,
      favoriteFood: data.favoriteFood,
      askMeAbout: data.askMeAbout,
    },
    select: {
      // Return only the updated fields for confirmation
      id: true,
      name: true,
      hobbies: true,
      favoriteFood: true,
      askMeAbout: true,
    },
  });

  return updatedUser;
};

interface ListUsersParams {
  page?: number;
  limit?: number;
  searchTerm?: string | null;
  excludeId?: string | null;
  // Add other filters like role if needed
}

/**
 * Lists users with filtering and pagination.
 * Primarily used for selecting potential hosts or general user listing.
 * @param params - Filtering and pagination parameters.
 * @param requestingUser - The user making the request (for potential auth checks).
 * @returns Paginated list of users.
 */
export const listUsers = async (
  params: ListUsersParams,
  requestingUser: AuthenticatedUser | null // May not be needed if auth is simple
) => {
  // --- Optional: Add stricter authorization if needed ---
  // if (!requestingUser) { throw new ForbiddenError("Authentication required to list users."); }
  // if (requestingUser.role !== UserRole.ADMIN) { throw new ForbiddenError("Admin privileges required."); }
  // --- End Optional Authorization ---

  const { page = 1, limit = 50, searchTerm, excludeId } = params;

  let whereClause: any = {};

  if (excludeId) {
    whereClause.id = { not: excludeId };
  }

  if (searchTerm) {
    // If excludeId is also present, combine with AND
    const searchCondition = {
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
      ],
    };
    if (whereClause.id) {
      whereClause = { AND: [whereClause, searchCondition] };
    } else {
      whereClause = searchCondition;
    }
  }

  const skip = (page - 1) * limit;

  // Fetch users and total count concurrently
  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      select: {
        // Select only fields needed for listing/selection
        id: true,
        name: true,
        email: true,
        image: true,
      },
      orderBy: { name: "asc" },
      take: limit,
      skip: skip,
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  return {
    data: users,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

// --- Zod Schema (Define or import) ---
// Ensure it's exported if the handler needs to import it for parsing
export const UserProfileUpdateSchema = z
  .object({
    name: z.string().min(1, "Name cannot be empty").max(100).optional(),
    hobbies: z.string().max(500).optional().nullable(),
    favoriteFood: z.string().max(100).optional().nullable(),
    askMeAbout: z.string().max(200).optional().nullable(),
  })
  .strict(); // Use strict to prevent unexpected fields

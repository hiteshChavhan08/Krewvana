// services/userService.ts

import { prisma } from "@/lib/prisma";
import { Prisma, UserRole, type User, type Skill } from "@prisma/client"; // Import necessary types
import { z } from "zod";
import {
  ApiError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError, // Added ConflictError if used in signup
} from "@/lib/api/responses";
import { ClientProfileUpdateSchema as BaseProfileUpdateSchema } from "@/lib/schemas"; // Import base schema

// Define or import AuthenticatedUser type
interface AuthenticatedUser {
  id: string;
  role?: UserRole | null;
  name?: string | null; // Include other fields potentially needed
  image?: string | null;
}

// --- Zod Schemas ---
// Schema for just the basic fields editable in ProfileSettingsForm
const BasicProfileSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").max(100).trim(),
  hobbies: z.string().max(500).optional().or(z.literal("")),
  favoriteFood: z.string().max(100).optional().or(z.literal("")),
  askMeAbout: z.string().max(200).optional().or(z.literal("")),
});

// Combined schema for the entire settings update payload
export const UserSettingsUpdateSchema = BasicProfileSchema.extend({
  positionId: z
    .string()
    .cuid("Invalid Position ID format.")
    .nullable()
    .optional(), // Allow string ID, null, or undefined
  skillNames: z
    .array(
      z
        .string()
        .min(1, "Skill name cannot be empty.")
        .max(50, "Skill name too long.")
        .trim()
    )
    .optional(), // Array of skill names
}).strict(); // Use strict

// Infer type from the combined schema
type UserSettingsUpdateData = z.infer<typeof UserSettingsUpdateSchema>;

// --- Service Functions ---

/**
 * Fetches the profile data for a given user ID.
 * Includes position, skills, verification status, and badges.
 * @param userId - The ID of the user whose profile to fetch.
 * @returns The user profile data.
 * @throws NotFoundError if the user doesn't exist.
 */
export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      // Select all fields needed for Profile and Settings pages
      id: true,
      name: true,
      email: true,
      image: true,
      points: true,
      createdAt: true,
      hobbies: true,
      favoriteFood: true,
      askMeAbout: true,
      isPositionVerified: true,
      position: { select: { id: true, name: true } },
      userSkills: {
        orderBy: { skill: { name: "asc" } }, // Order skills alphabetically
        select: { skill: { select: { id: true, name: true } } },
      },
      // Include badges if needed on profile/settings
      // userBadges: {
      //   orderBy: { earnedAt: "desc" },
      //   select: { earnedAt: true, badge: { select: { id: true, name: true, description: true, iconName: true } } }
      // },
    },
  });

  if (!user) {
    throw new NotFoundError("User");
  }

  // Map skills to simpler array for easier consumption
  const skills = user.userSkills.map((us) => us.skill);
  const { userSkills, ...rest } = user; // Exclude the nested structure

  return { ...rest, skills }; // Return profile with flat skills array
};

/**
 * Updates the profile and settings data for a given user.
 * Handles basic fields, position change (with verification reset), and skill updates (manual diff).
 * Uses a transaction for atomicity.
 * @param userId - The ID of the user to update.
 * @param data - The validated data to update, conforming to UserSettingsUpdateSchema.
 * @returns The subset of updated user data, including re-fetched skills.
 * @throws ApiError subclasses for validation, not found, forbidden, etc.
 */
export const updateUserSettings = async (
  userId: string,
  data: UserSettingsUpdateData // Use the specific inferred type
) => {
  // Separate payload for direct user fields vs relational fields
  const userDirectUpdatePayload: Prisma.UserUpdateInput = {};
  let needsVerificationReset = false;

  // Basic profile fields
  if (data.name !== undefined) userDirectUpdatePayload.name = data.name;
  if (data.hobbies !== undefined)
    userDirectUpdatePayload.hobbies = data.hobbies;
  if (data.favoriteFood !== undefined)
    userDirectUpdatePayload.favoriteFood = data.favoriteFood;
  if (data.askMeAbout !== undefined)
    userDirectUpdatePayload.askMeAbout = data.askMeAbout;

  // Position update
  if ("positionId" in data) {
    // Check if the key exists, even if null
    const currentUserData = await prisma.user.findUnique({
      where: { id: userId },
      select: { positionId: true },
    });
    // Update only if the new value is different from the current one
    if (currentUserData?.positionId !== data.positionId) {
      userDirectUpdatePayload.position = data.positionId
        ? { connect: { id: data.positionId } } // Connect if ID provided
        : { disconnect: true }; // Disconnect if null
      needsVerificationReset = true;
      userDirectUpdatePayload.isPositionVerified = false; // Reset verification on change
    }
  }

  // Transaction for skills and user update
  const updatedUser = await prisma.$transaction(async (tx) => {
    // --- Handle Skills (if skillNames array is provided in the input data) ---
    if (data.skillNames !== undefined) {
      // 1. Upsert Skills based on names to ensure they exist and get IDs
      const skillUpsertOps = data.skillNames.map((name: string) =>
        tx.skill.upsert({
          where: { name: name.toLowerCase() }, // Use lowercase for consistency
          update: {},
          create: { name: name.toLowerCase() },
          select: { id: true }, // Only need the ID
        })
      );
      const targetSkills: { id: string }[] = await Promise.all(skillUpsertOps);
      const targetSkillIds = new Set(targetSkills.map((s) => s.id)); // Set of desired skill IDs for efficient lookup

      // 2. Get current UserSkill IDs for this user
      const currentUserSkills = await tx.userSkill.findMany({
        where: { userId: userId },
        select: { skillId: true },
      });
      const currentSkillIds = new Set(
        currentUserSkills.map((us) => us.skillId)
      );

      // 3. Determine Skill IDs to Add (present in target, not in current)
      const skillIdsToAdd = targetSkills
        .filter((s) => !currentSkillIds.has(s.id))
        .map((s) => s.id);

      // 4. Determine Skill IDs to Remove (present in current, not in target)
      const skillIdsToRemove = currentUserSkills
        .filter((us) => !targetSkillIds.has(us.skillId))
        .map((us) => us.skillId);

      // 5. Remove old UserSkill links
      if (skillIdsToRemove.length > 0) {
        await tx.userSkill.deleteMany({
          where: {
            userId: userId,
            skillId: { in: skillIdsToRemove },
          },
        });
      }

      // 6. Create new UserSkill links
      if (skillIdsToAdd.length > 0) {
        await tx.userSkill.createMany({
          data: skillIdsToAdd.map((skillId) => ({
            userId: userId, // Explicitly provide both IDs
            skillId: skillId,
            // Add other default UserSkill fields if necessary (e.g., proficiency: null)
          })),
          skipDuplicates: true, // Safety measure
        });
      }
      // No need to include userSkills in userDirectUpdatePayload as we managed UserSkill directly
    }
    // If skillNames was not included in the input 'data', we don't modify skills.

    // Perform the user update with only the direct fields modified
    return tx.user.update({
      where: { id: userId },
      data: userDirectUpdatePayload, // Contains name, hobbies, position, isPositionVerified etc.
      select: {
        // Select necessary fields to return to the client
        id: true,
        name: true,
        hobbies: true,
        favoriteFood: true,
        askMeAbout: true,
        isPositionVerified: true,
        position: { select: { id: true, name: true } },
        // Re-fetch the skills relation to reflect the changes made above
        userSkills: {
          orderBy: { skill: { name: "asc" } },
          select: { skill: { select: { id: true, name: true } } },
        },
      },
    });
  }); // End of transaction

  // Map skills for return consistency
  // Define the expected shape based on the final select
  type UserSkillWithSkill = { skill: { id: string; name: string } };
  const skills = updatedUser.userSkills.map((s: UserSkillWithSkill) => s.skill);
  const { userSkills, ...rest } = updatedUser; // Exclude the nested structure
  return { ...rest, skills }; // Return profile with flat skills array
};

// --- Other User Service Functions ---

// Interface for listUsers parameters
interface ListUsersParams {
  page?: number;
  limit?: number;
  searchTerm?: string | null;
  excludeId?: string | null;
  // role?: UserRole; // Optional filter by platform role
}

/**
 * Lists users with filtering and pagination.
 * @param params - Filtering and pagination parameters.
 * @param requestingUser - The user making the request (for potential auth checks).
 * @returns Paginated list of users ({ data: User[], pagination: {...} }).
 */
export const listUsers = async (
  params: ListUsersParams,
  requestingUser: AuthenticatedUser | null // Pass null if auth not strictly needed
) => {
  // Optional Authorization check (e.g., only Admins can list all users)
  // if (!requestingUser || requestingUser.role !== UserRole.ADMIN) {
  //     throw new ForbiddenError("Permission denied to list users.");
  // }

  const { page = 1, limit = 50, searchTerm, excludeId } = params;

  // Validate pagination
  if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > 200) {
    throw new BadRequestError("Invalid pagination parameters.");
  }

  let whereClause: Prisma.UserWhereInput = {};

  if (excludeId) {
    whereClause.id = { not: excludeId };
  }

  if (searchTerm) {
    const searchCondition = {
      OR: [
        {
          name: {
            contains: searchTerm,
            mode: "insensitive" as Prisma.QueryMode,
          },
        },
        {
          email: {
            contains: searchTerm,
            mode: "insensitive" as Prisma.QueryMode,
          },
        },
      ],
    };
    // Combine with excludeId if present
    if (whereClause.id) {
      whereClause = { AND: [whereClause, searchCondition] };
    } else {
      whereClause = searchCondition;
    }
  }
  // Add role filter if needed:
  // if (params.role) {
  //     whereClause.role = params.role;
  // }

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

// --- (Keep other service functions like signupUser if they exist) ---

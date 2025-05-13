// services/categoryService.ts

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { BadRequestError, NotFoundError } from "@/lib/api/responses";

// Schema for creating/updating a category
export const CategorySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters").trim(),
    description: z.string().max(200, "Description cannot exceed 200 characters").optional().nullable(),
    iconName: z.string().max(50, "Icon name cannot exceed 50 characters").optional().nullable(),
});
export type CategoryInput = z.infer<typeof CategorySchema>;

// --- Service Functions ---

/**
 * Lists all Kudos Appreciation Categories.
 */
export const listKudosCategories = async () => {
    return await prisma.kudosAppreciationCategory.findMany({
        orderBy: { name: 'asc' },
    });
};

/**
 * Creates a new Kudos Appreciation Category.
 * @param data Validated category data.
 * @returns The newly created category.
 * @throws BadRequestError if name already exists.
 */
export const createKudosCategory = async (data: CategoryInput) => {
    // Check for uniqueness
    const existing = await prisma.kudosAppreciationCategory.findUnique({
        where: { name: data.name },
    });
    if (existing) {
        throw new BadRequestError(`Category with name "${data.name}" already exists.`);
    }

    return await prisma.kudosAppreciationCategory.create({
        data: {
            name: data.name,
            description: data.description,
            iconName: data.iconName,
        },
    });
};

/**
 * Updates an existing Kudos Appreciation Category.
 * @param categoryId The ID of the category to update.
 * @param data Validated category data.
 * @returns The updated category.
 * @throws NotFoundError if category not found.
 * @throws BadRequestError if new name conflicts with another category.
 */
export const updateKudosCategory = async (categoryId: string, data: Partial<CategoryInput>) => {
     // Check if category exists first
     const existingCategory = await prisma.kudosAppreciationCategory.findUnique({
        where: { id: categoryId }
    });
    if (!existingCategory) {
        throw new NotFoundError(`Category with ID ${categoryId}`);
    }

    // If name is being changed, check for uniqueness conflict (excluding self)
    if (data.name && data.name !== existingCategory.name) {
        const conflicting = await prisma.kudosAppreciationCategory.findFirst({
            where: {
                name: data.name,
                id: { not: categoryId } // Exclude the current category being updated
            },
        });
        if (conflicting) {
            throw new BadRequestError(`Another category with the name "${data.name}" already exists.`);
        }
    }

    return await prisma.kudosAppreciationCategory.update({
        where: { id: categoryId },
        data: { // Only update provided fields
            name: data.name,
            description: data.description,
            iconName: data.iconName,
        },
    });
};

/**
 * Deletes a Kudos Appreciation Category.
 * Also deletes associated links in KudosCategoryLink due to onDelete: Cascade.
 * @param categoryId The ID of the category to delete.
 * @returns The deleted category record (or void).
 * @throws NotFoundError if category not found.
 */
export const deleteKudosCategory = async (categoryId: string) => {
    // Check if category exists first (prisma delete throws if not found, but nice to have specific error)
     const existing = await prisma.kudosAppreciationCategory.findUnique({
        where: { id: categoryId },
        select: { id: true }
    });
    if (!existing) {
        throw new NotFoundError(`Category with ID ${categoryId}`);
    }

    // Deletion will cascade to KudosCategoryLink table due to schema relation
    return await prisma.kudosAppreciationCategory.delete({
        where: { id: categoryId },
    });
};
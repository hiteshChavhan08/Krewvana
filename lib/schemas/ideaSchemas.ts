// lib/schemas/ideaSchemas.ts
import { z } from "zod";
import { IdeaStatus } from "@prisma/client";
import { TagSchema } from "./commonSchemas";

// --- API Schemas for Ideas ---
export const IdeaCreateAPISchema = z.object({
  title: z.string().min(5, "Title min 5 chars").max(150, "Title max 150 chars"),
  description: z
    .string()
    .min(20, "Desc min 20 chars")
    .max(2000, "Desc max 2000 chars"),
  category: z.array(TagSchema).max(5).optional().default([]),
});
export type IdeaCreateAPIData = z.infer<typeof IdeaCreateAPISchema>;

export const IdeaUpdateAPISchema = z
  .object({
    title: z.string().min(5).max(150).optional(),
    description: z.string().min(20).max(5000).optional(),
    category: z.array(TagSchema).max(5).optional(),
    status: z.nativeEnum(IdeaStatus).optional(),
  })
  .refine(
    (data) =>
      Object.keys(data).length > 0 &&
      Object.values(data).some((v) => v !== undefined),
    {
      message: "At least one field must be provided for an update.",
    }
  );
export type IdeaUpdateAPIData = z.infer<typeof IdeaUpdateAPISchema>;

// --- Form Schemas for Ideas (Reusable UI Form) ---
const IdeaFormFieldShapeSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required.")
    .max(150, "Title cannot exceed 150 characters."),
  description: z
    .string()
    .min(1, "Description is required.")
    .max(5000, "Description cannot exceed 5000 characters."),
  category: z
    .array(TagSchema)
    .max(5, "You can add up to 5 categories.")
    .optional()
    .default([]),
  status: z.nativeEnum(IdeaStatus).optional(),
});

const PartialIdeaFormFieldSchema = IdeaFormFieldShapeSchema.partial();
export type IdeaUnifiedFormData = z.infer<typeof PartialIdeaFormFieldSchema>;

export const IdeaFormCreateValidationSchema = IdeaFormFieldShapeSchema.omit({
  status: true,
})
  .refine((data) => data.title.trim().length >= 5, {
    message: "Title must be at least 5 characters.",
    path: ["title"],
  })
  .refine((data) => data.description.trim().length >= 20, {
    message: "Description must be at least 20 characters.",
    path: ["description"],
  });
export type IdeaFormCreateValidationData = z.infer<
  typeof IdeaFormCreateValidationSchema
>;

export const IdeaFormUpdateValidationSchema = IdeaFormFieldShapeSchema.partial()
  .refine(
    (data) =>
      Object.values(data).some(
        (value) =>
          value !== undefined &&
          (typeof value !== "string" || value.trim() !== "")
      ),
    {
      message:
        "At least one field must be provided with a meaningful value for an update.",
    }
  )
  .refine(
    (data) =>
      data.title === undefined ||
      data.title.trim().length === 0 ||
      data.title.trim().length >= 5,
    {
      message: "Title must be at least 5 characters if provided.",
      path: ["title"],
    }
  )
  .refine(
    (data) =>
      data.description === undefined ||
      data.description.trim().length === 0 ||
      data.description.trim().length >= 20,
    {
      message: "Description must be at least 20 characters if provided.",
      path: ["description"],
    }
  );
export type IdeaFormUpdateValidationData = z.infer<
  typeof IdeaFormUpdateValidationSchema
>;

// --- Schemas for Idea Comments ---
export const IdeaCommentCreateSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty.")
    .max(1000, "Comment is too long."),
});
export type IdeaCommentCreateData = z.infer<typeof IdeaCommentCreateSchema>;

export const IdeaCommentsQuerySchema = z.object({
  page: z.string().optional().default("1").transform(Number),
  limit: z.string().optional().default("10").transform(Number),
  sortBy: z.enum(["createdAt"]).optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});
export type IdeaCommentsQueryData = z.infer<typeof IdeaCommentsQuerySchema>;

// lib/schemas.ts
import { IdeaStatus, ShoutoutType, UserRole } from "@prisma/client";
import { z } from "zod";

// --- General Purpose Schemas ---

export const TagSchema = z
  .string()
  .min(1, "Tag cannot be empty")
  .max(25, "Tag cannot be longer than 25 characters")
  .regex(
    /^[a-zA-Z0-9\s-]+$/,
    "Tag can only contain letters, numbers, spaces, and hyphens"
  );

export const KudosCreateSchema = z.object({
  receiverId: z.string().cuid({ message: "Please select a valid recipient." }),
  message: z
    .string()
    .min(5, { message: "Message must be at least 5 characters long." })
    .max(500, { message: "Message cannot exceed 500 characters." })
    .trim(),
  categoryIds: z
    .array(z.string().cuid())
    .min(1, { message: "Please select at least one category." }),
});
export type KudosCreateData = z.infer<typeof KudosCreateSchema>;

export const LearningResourceCreateSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title too long"),
  url: z.string().url({
    message: "Please enter a valid URL (including http:// or https://)",
  }),
  description: z
    .string()
    .max(1000, "Description too long")
    .optional()
    .or(z.literal("")),
});
export type LearningResourceCreateData = z.infer<
  typeof LearningResourceCreateSchema
>;

export const InnovationIdeaCreateSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title too long"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description too long"),
});
export type InnovationIdeaCreateData = z.infer<
  typeof InnovationIdeaCreateSchema
>;

export const ShoutoutCreateSchema = z.object({
  type: z.nativeEnum(ShoutoutType, {
    errorMap: () => ({ message: "Please select a valid shoutout type" }),
  }),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message too long"),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
  relatedUserId: z
    .string()
    .cuid("Invalid user ID")
    .optional()
    .or(z.literal("")),
});
export type ShoutoutCreateData = z.infer<typeof ShoutoutCreateSchema>;

export const UserSignupSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100)
      .trim(),
    email: z
      .string()
      .email("Please enter a valid email address")
      .toLowerCase()
      .trim(),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .strict();

export const ClientProfileUpdateSchema = z
  .object({
    name: z.string().min(1, "Name cannot be empty").max(100).trim().optional(),
    hobbies: z
      .string()
      .max(500, "Hobbies text too long")
      .optional()
      .or(z.literal("")),
    favoriteFood: z
      .string()
      .max(100, "Favorite food text too long")
      .optional()
      .or(z.literal("")),
    askMeAbout: z
      .string()
      .max(200, "Ask me about text too long")
      .optional()
      .or(z.literal("")),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the profile.",
  });
export type ClientProfileUpdateData = z.infer<typeof ClientProfileUpdateSchema>;

// --- Schemas for Idea Wall API ---
export const IdeaCreateAPISchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(150, "Title must be 150 characters or less"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be 2000 characters or less"),
  category: z
    .array(TagSchema)
    .max(5, "You can add up to 5 categories/tags.")
    .optional()
    .default([]),
});
export type IdeaCreateAPIData = z.infer<typeof IdeaCreateAPISchema>;

export const IdeaUpdateAPISchema = z
  .object({
    title: z
      .string()
      .min(5, "Title must be at least 5 characters.")
      .max(150)
      .optional(),
    description: z
      .string()
      .min(20, "Description must be at least 20 characters.")
      .max(5000)
      .optional(),
    category: z
      .array(TagSchema)
      .max(5, "You can add up to 5 categories.")
      .optional(),
    status: z.nativeEnum(IdeaStatus).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for an update.",
  });
export type IdeaUpdateAPIData = z.infer<typeof IdeaUpdateAPISchema>;

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

// --- Schemas Specifically for the Reusable Idea FORM Component ---
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
  .refine((data) => data.title === undefined || data.title.trim().length >= 5, {
    message: "Title must be at least 5 characters if provided.",
    path: ["title"],
  })
  .refine(
    (data) =>
      data.description === undefined || data.description.trim().length >= 20,
    {
      message: "Description must be at least 20 characters if provided.",
      path: ["description"],
    }
  );
export type IdeaFormUpdateValidationData = z.infer<
  typeof IdeaFormUpdateValidationSchema
>;

// lib/schemas.ts
import { IdeaStatus, ShoutoutType, UserRole } from "@prisma/client"; // Added UserRole assuming it might be needed
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
    .or(z.literal("")), // Allow empty string or optional
});
export type LearningResourceCreateData = z.infer<
  typeof LearningResourceCreateSchema
>;

// Note: You had an "InnovationIdeaCreateSchema". If this is different from the main "IdeaCreateSchema", keep it.
// If it's the same feature, you might consolidate. For now, I'll assume it's distinct.
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
    name: z.string().min(1, "Name cannot be empty").max(100).trim().optional(), // Made name optional for partial updates
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
    // Ensure at least one field is provided for update
    message: "At least one field must be provided to update the profile.",
  });
export type ClientProfileUpdateData = z.infer<typeof ClientProfileUpdateSchema>;

// --- Schemas for Idea Wall API ---

// API: Schema for creating an idea
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
    .array(TagSchema) // Use the refined TagSchema
    .max(5, "You can add up to 5 categories/tags.")
    .optional()
    .default([]), // Default to empty array if not provided
});
export type IdeaCreateAPIData = z.infer<typeof IdeaCreateAPISchema>;

// API: Schema for updating an idea
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
    status: z.nativeEnum(IdeaStatus).optional(), // For admin to update status
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

// 1. Defines the shape of all fields the form UI can manage.
//    Title and Description are required here as a base for form validation.
const IdeaFormFieldShapeSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required.")
    .max(150, "Title cannot exceed 150 characters."), // Min 1 for required check
  description: z
    .string()
    .min(1, "Description is required.")
    .max(5000, "Description cannot exceed 5000 characters."), // Min 1 for required
  category: z
    .array(TagSchema)
    .max(5, "You can add up to 5 categories.")
    .optional()
    .default([]),
  status: z.nativeEnum(IdeaStatus).optional(), // Status is optional in the form UI itself (only for admin edits)
});

// 2. Unified Form Data Type for useForm<T> (all fields optional for form's internal state)
//    This allows react-hook-form to manage fields that might be initially empty or cleared.
const PartialIdeaFormFieldSchema = IdeaFormFieldShapeSchema.partial();
export type IdeaUnifiedFormData = z.infer<typeof PartialIdeaFormFieldSchema>;
// Alternative inference: export type IdeaUnifiedFormData = z.input<typeof IdeaFormFieldShapeSchema.partial>;

// 3. Validation Schema passed to zodResolver when CREATING an idea via the form.
export const IdeaFormCreateValidationSchema = IdeaFormFieldShapeSchema.omit({
  status: true,
}) // Users don't set status on create.
  // Additional refinements if the base min(1) isn't enough (e.g. more specific length for create)
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

// 4. Validation Schema passed to zodResolver when UPDATING an idea via the form.
//    This makes all fields optional for the update payload but ensures at least one is provided.
export const IdeaFormUpdateValidationSchema = IdeaFormFieldShapeSchema.partial() // Makes all fields optional for the update
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
  // Add specific min length checks for fields if they are provided for update
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

// --- End Schemas for Idea Wall ---

// lib/schemas.ts
import { ShoutoutType } from "@prisma/client";
import { z } from "zod";

export const KudosCreateSchema = z.object({
  receiverId: z.string().cuid({ message: "Please select a valid recipient." }),
  message: z
    .string()
    .min(5, { message: "Message must be at least 5 characters long." })
    .max(500, { message: "Message cannot exceed 500 characters." }) // Adjust max length
    .trim(),
  // Expect an array of CUID strings for categories
  categoryIds: z
    .array(z.string().cuid())
    .min(1, { message: "Please select at least one category." }), // Require at least one category
  // .max(3, { message: "You can select up to 3 categories." }) // Optional: Limit max categories
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
    // Validate against the enum
    errorMap: (issue, ctx) => ({
      message: "Please select a valid shoutout type",
    }),
  }),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message too long"),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")), // Optional URL
  relatedUserId: z
    .string()
    .cuid("Invalid user ID")
    .optional()
    .or(z.literal("")), // Optional CUID
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
    // Add password complexity requirements here if desired using .regex() or other checks
    password: z.string().min(8, "Password must be at least 8 characters"),
    // Note: confirmPassword is usually only needed on the client-side form
  })
  .strict(); // Use strict to prevent unexpected fields in the request body

// Schema for client-side checks (matches backend ideally)
export const ClientProfileUpdateSchema = z
  .object({
    name: z.string().min(1, "Name cannot be empty").max(100).trim(),
    // Allow empty strings from textarea/input using .or(z.literal(""))
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
  .strict(); // Prevent extra fields

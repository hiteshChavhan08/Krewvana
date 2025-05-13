// lib/schemas/commonSchemas.ts
import { z } from "zod";

export const TagSchema = z
  .string()
  .min(1, "Tag cannot be empty")
  .max(25, "Tag cannot be longer than 25 characters")
  .regex(
    /^[a-zA-Z0-9\s-]+$/,
    "Tag can only contain letters, numbers, spaces, and hyphens"
  )
  .trim(); // Add trim

// lib/schemas/userSchemas.ts
import { z } from 'zod';

export const UserSignupSchema = z.object({
    name: z.string().min(2, "Name min 2 chars").max(100).trim(),
    email: z.string().email("Invalid email").toLowerCase().trim(),
    password: z.string().min(8, "Password min 8 chars"),
}).strict();
export type UserSignupData = z.infer<typeof UserSignupSchema>;


export const ClientProfileUpdateSchema = z.object({
    name: z.string().min(1, "Name cannot be empty").max(100).trim().optional(),
    hobbies: z.string().max(500).optional().or(z.literal("")),
    favoriteFood: z.string().max(100).optional().or(z.literal("")),
    askMeAbout: z.string().max(200).optional().or(z.literal("")),
}).strict().refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update profile.",
});
export type ClientProfileUpdateData = z.infer<typeof ClientProfileUpdateSchema>;
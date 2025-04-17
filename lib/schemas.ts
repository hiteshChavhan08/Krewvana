// lib/schemas.ts
import { ShoutoutType } from '@prisma/client';
import { z } from 'zod';

export const KudosCreateSchema = z.object({
  receiverId: z.string().cuid({ message: 'Invalid receiver ID format' }),
  message: z.string().min(3, { message: 'Message must be at least 3 characters long' }).max(500, { message: 'Message must be 500 characters or less' }),
});

export type KudosCreateData = z.infer<typeof KudosCreateSchema>;

export const LearningResourceCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(150, 'Title too long'),
  url: z.string().url({ message: 'Please enter a valid URL (including http:// or https://)' }),
  description: z.string().max(1000, 'Description too long').optional().or(z.literal('')), // Allow empty string or optional
});
export type LearningResourceCreateData = z.infer<typeof LearningResourceCreateSchema>;

export const InnovationIdeaCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(150, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
});
export type InnovationIdeaCreateData = z.infer<typeof InnovationIdeaCreateSchema>;

export const ShoutoutCreateSchema = z.object({
  type: z.nativeEnum(ShoutoutType, { // Validate against the enum
      errorMap: (issue, ctx) => ({ message: 'Please select a valid shoutout type' })
  }),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message too long'),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')), // Optional URL
  relatedUserId: z.string().cuid('Invalid user ID').optional().or(z.literal('')), // Optional CUID
});

export type ShoutoutCreateData = z.infer<typeof ShoutoutCreateSchema>;
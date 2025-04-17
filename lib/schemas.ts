// lib/schemas.ts
import { z } from 'zod';

export const KudosCreateSchema = z.object({
  receiverId: z.string().cuid({ message: 'Invalid receiver ID format' }),
  message: z.string().min(3, { message: 'Message must be at least 3 characters long' }).max(500, { message: 'Message must be 500 characters or less' }),
});

export type KudosCreateData = z.infer<typeof KudosCreateSchema>;
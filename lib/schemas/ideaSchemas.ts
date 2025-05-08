// lib/schemas/ideaSchemas.ts
import { z } from 'zod';

// ... other schemas (like IdeaCreateSchema)

export const IdeaCommentCreateSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty.").max(1000, "Comment is too long."),
  // ideaId will come from the route parameter, not the body
  // authorId will come from the session
});

export type IdeaCommentCreateData = z.infer<typeof IdeaCommentCreateSchema>;

// Schema for fetching comments (query parameters)
export const IdeaCommentsQuerySchema = z.object({
  page: z.string().optional().default("1").transform(Number),
  limit: z.string().optional().default("10").transform(Number),
  sortBy: z.enum(['createdAt']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type IdeaCommentsQueryData = z.infer<typeof IdeaCommentsQuerySchema>;
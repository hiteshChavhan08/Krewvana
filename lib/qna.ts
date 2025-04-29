// types/qna.ts
import { Prisma, VoteType } from '@prisma/client';

// Type for basic user info included in responses
export type AuthorInfo = {
  id: string;
  name: string | null;
  image: string | null;
};

// Type for tag info included in responses
export type TagInfo = {
  id: string;
  name: string;
};

// Type for a single answer with processed vote info
export type ProcessedAnswer = {
  id: string;
  content: Prisma.JsonValue; // Matches Prisma schema (Plate.js JSON)
  createdAt: Date;
  updatedAt: Date;
  author: AuthorInfo;
  questionId: string;
  isAccepted: boolean;
  // Added fields from API processing:
  voteCount: number;
  userVote: VoteType | null; // 'UPVOTE' or null
};

// Type for the main detailed question object returned by the API
export type DetailedQuestion = {
  id: string;
  title: string;
  content: Prisma.JsonValue; // Matches Prisma schema (Plate.js JSON)
  createdAt: Date;
  updatedAt: Date;
  author: AuthorInfo;
  tags: { tag: TagInfo }[]; // Array of tag relations
  acceptedAnswerId: string | null;
  // Added fields from API processing:
  voteCount: number;
  userVote: VoteType | null; // 'UPVOTE' or null
  answers: ProcessedAnswer[]; // Array of processed answers
};

// Optional: Type for the Question List Item (from GET /api/questions)
// Might differ slightly from DetailedQuestion (e.g., no full content)
export type QuestionListItemData = {
    id: string;
    title: string;
    createdAt: Date;
    author: AuthorInfo;
    tags: { tag: TagInfo }[];
    acceptedAnswer: { id: string } | null; // Just need to know if it exists
    _count: {
        answers: number;
        votes: number;
    };
    // We might add userVote status here later if needed for the list view
};
import type { AMASession, AMAQuestion, User as PrismaUser, AMASessionStatus, UserRole } from "@prisma/client";

export type SimpleUser = {
  id: string;
  name: string | null;
  email: string | null; // Good fallback if name is null
  image?: string | null; // Optional image
};

export type CurrentUserData = Pick<PrismaUser, 'id' | 'name' | 'image' | 'role'>;

// Type for the main session data fetched server-side and passed down
export type AMASessionPageData = AMASession & {
  host: Pick<PrismaUser, 'id' | 'name' | 'image'>;
  _count: {
    questions: number;
  };
};

// Type for individual questions fetched client-side
export type AMAQuestionData = AMAQuestion & {
  submittedBy: Pick<PrismaUser, 'id' | 'name' | 'image'> | null; // User might be deleted
  answeredBy: Pick<PrismaUser, 'id' | 'name' | 'image'> | null;  // User might be deleted
};

// You might already have this from previous code
export interface AMASessionData extends AMASession {
    host: Pick<PrismaUser, 'id' | 'name' | 'image'>;
    _count: {
        questions: number;
    };
}
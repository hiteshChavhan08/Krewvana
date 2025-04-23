import { AMASessionStatus } from "@prisma/client";

// lib/types.ts (or similar shared location)
export type SimpleUser = {
  id: string;
  name: string | null;
  email: string | null; // Good fallback if name is null
  image?: string | null; // Optional image
};

export type AMASessionData = {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string | Date;
  status: AMASessionStatus;
  isTechSpecific: boolean;
  topic: string | null;
  host: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count: {
    questions: number;
  };
};

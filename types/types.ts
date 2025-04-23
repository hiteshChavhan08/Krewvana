// lib/types.ts (or similar shared location)
export type SimpleUser = {
    id: string;
    name: string | null;
    email: string | null; // Good fallback if name is null
    image?: string | null; // Optional image
  };
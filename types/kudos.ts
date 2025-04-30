// types/kudos.ts (or similar shared types file)

type KudosUser = {
    id: string;
    name: string | null;
    image: string | null;
  };
  
  export type KudosData = {
    id: string;
    message: string;
    createdAt: string; // Keep as string from API, parse on client
    giver: KudosUser | null;
    receiver: KudosUser | null;
  };
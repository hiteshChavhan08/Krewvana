// types/leaderboard.ts
export type LeaderboardUser = {
    id: string;
    name: string | null;
    image: string | null;
    points: number;
    rank: number; // Rank is crucial for styling
  };
// components/leaderboard/TopThreePodium.tsx
import React from 'react';
import { type LeaderboardUser } from '@/types/leaderboard';
import { PodiumItem } from './PodiumItem';

interface TopThreePodiumProps {
  users: LeaderboardUser[]; // Expects exactly 3 users, sorted by rank
}

export const TopThreePodium: React.FC<TopThreePodiumProps> = ({ users }) => {
  if (users.length < 3) {
    // Handle cases with fewer than 3 users if necessary, or rely on parent logic
    console.warn("TopThreePodium requires 3 users.");
    return null; // Or render differently
  }

  const [first, second, third] = users; // Assumes sorted data [rank1, rank2, rank3]

  return (
    // Use flexbox to arrange items, items-end aligns bases
    <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-0 md:space-x-[-20px] lg:space-x-[-30px] mb-12">
        {/* Rank 2 */}
        <div className="w-full md:w-1/4 order-2 md:order-1">
             <PodiumItem user={second} rank={2} />
        </div>
        {/* Rank 1 - Elevated and wider */}
        <div className="w-full md:w-1/3 order-1 md:order-2 z-10"> {/* Use z-index to ensure #1 overlaps slightly if needed */}
            <PodiumItem user={first} rank={1} />
        </div>
        {/* Rank 3 */}
        <div className="w-full md:w-1/4 order-3 md:order-3">
            <PodiumItem user={third} rank={3} />
        </div>
    </div>
  );
};
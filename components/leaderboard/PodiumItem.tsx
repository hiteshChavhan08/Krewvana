// components/leaderboard/PodiumItem.tsx
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Star } from 'lucide-react'; // Using Star for points
import { cn } from '@/lib/utils';
import { type LeaderboardUser } from '@/types/leaderboard'; // Adjust path
import { getInitials } from '@/lib/utils/helpers'; // Adjust path
import Link from 'next/link';

interface PodiumItemProps {
  user: LeaderboardUser;
  rank: 1 | 2 | 3;
}

export const PodiumItem: React.FC<PodiumItemProps> = ({ user, rank }) => {
  const isFirst = rank === 1;
  const rankStyles = {
    1: {
      bgColor: 'bg-gradient-to-b from-yellow-400/20 to-transparent',
      borderColor: 'border-yellow-500/80',
      textColor: 'text-yellow-400',
      trophyColor: 'text-yellow-500',
      height: 'h-48', // Taller for first place
      translateY: '-translate-y-4 md:-translate-y-6', // Elevated more
      shadow: 'shadow-xl shadow-yellow-500/10',
      avatarSize: 'h-20 w-20',
      nameSize: 'text-lg',
      pointsSize: 'text-xl',
    },
    2: {
      bgColor: 'bg-gradient-to-b from-slate-400/20 to-transparent',
      borderColor: 'border-slate-500/80',
      textColor: 'text-slate-400',
      trophyColor: 'text-slate-400',
      height: 'h-44', // Slightly shorter
      translateY: 'translate-y-0', // Base level
      shadow: 'shadow-lg shadow-slate-500/10',
      avatarSize: 'h-16 w-16',
      nameSize: 'text-base',
      pointsSize: 'text-lg',
    },
    3: {
      bgColor: 'bg-gradient-to-b from-orange-500/20 to-transparent',
      borderColor: 'border-orange-600/80',
      textColor: 'text-orange-500',
      trophyColor: 'text-orange-500',
      height: 'h-44', // Slightly shorter
      translateY: 'translate-y-0', // Base level
      shadow: 'shadow-lg shadow-orange-500/10',
      avatarSize: 'h-16 w-16',
      nameSize: 'text-base',
      pointsSize: 'text-lg',
    },
  };

  const styles = rankStyles[rank];

  return (
    <Link href={`/app/profile/${user.id}`} className="block group w-full">
      <div
        className={cn(
          'relative flex flex-col items-center justify-end p-4 rounded-t-lg border-b-4 transition-transform duration-300 ease-out',
          styles.bgColor,
          styles.borderColor,
          styles.height,
          styles.shadow,
          isFirst ? styles.translateY : '' // Apply elevation only to first
        )}
      >
        {/* Avatar positioned absolutely on top */}
        <div className={cn("absolute -top-1/3 left-1/2 -translate-x-1/2 transform transition-transform duration-300 group-hover:scale-105", styles.avatarSize)}>
            <Avatar className={cn("w-full h-full border-4", styles.borderColor)}>
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'User'} />
                <AvatarFallback className="text-xl">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
        </div>

        {/* Content inside */}
        <div className="text-center mt-8"> {/* Add margin-top to account for avatar */}
          <h3 className={cn("font-semibold truncate", styles.nameSize, styles.textColor)}>
            {user.name || 'Anonymous'}
          </h3>
          <div className={cn("flex items-center justify-center gap-1 mt-1", styles.pointsSize, styles.textColor)}>
            <Trophy className={cn("h-4 w-4", styles.trophyColor)} />
            <span className="font-bold">{user.points.toLocaleString()}</span>
          </div>
          <p className={cn("text-xs uppercase tracking-wider opacity-70", styles.textColor)}>Points</p>
        </div>
      </div>
    </Link>
  );
};
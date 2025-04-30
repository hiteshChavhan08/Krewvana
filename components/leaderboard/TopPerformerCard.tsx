// components/leaderboard/TopPerformerCard.tsx
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type LeaderboardUser } from '@/types/leaderboard';
import { getInitials } from '@/lib/utils/helpers';
import Link from 'next/link';

interface TopPerformerCardProps {
  user: LeaderboardUser;
}

export const TopPerformerCard: React.FC<TopPerformerCardProps> = ({ user }) => {
  const rank = user.rank;
  const rankStyles = {
    1: {
      gradient: 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-900 dark:text-yellow-300',
      borderColor: 'border-yellow-500/50',
      shadow: 'shadow-lg shadow-yellow-500/20',
    },
    2: {
      gradient: 'bg-gradient-to-br from-gray-300 via-gray-400 to-slate-400',
      iconColor: 'text-gray-600 dark:text-gray-300',
      textColor: 'text-gray-800 dark:text-gray-200',
      borderColor: 'border-gray-400/50',
      shadow: 'shadow-lg shadow-gray-500/20',
    },
    3: {
      gradient: 'bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600',
      iconColor: 'text-orange-600 dark:text-orange-300',
      textColor: 'text-orange-900 dark:text-orange-200',
      borderColor: 'border-orange-500/50',
      shadow: 'shadow-lg shadow-orange-500/20',
    },
  };

  const styles = rankStyles[rank as keyof typeof rankStyles] || rankStyles[3]; // Fallback for safety

  return (
    <Link href={`/app/profile/${user.id}`} className="block group">
        <Card className={cn(
            "overflow-hidden relative transition-all duration-300 ease-in-out hover:-translate-y-1",
            styles.gradient,
            styles.shadow
            // styles.borderColor // Optional subtle border
            )}>
            {/* Rank Badge */}
            <div className={cn(
                "absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center border-2",
                 rank === 1 ? 'bg-yellow-500 border-yellow-300' : rank === 2 ? 'bg-gray-400 border-gray-200' : 'bg-orange-500 border-orange-300'
                 )}>
                <span className={cn("font-bold text-sm", rank === 1 ? 'text-yellow-900': 'text-white')}>{rank}</span>
            </div>

            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                 <Avatar className="w-16 h-16 mb-3 border-2 border-background/50">
                    <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'User'} />
                    <AvatarFallback className="text-xl">{getInitials(user.name)}</AvatarFallback>
                 </Avatar>
                 <h3 className={cn("text-lg font-semibold truncate", styles.textColor)}>{user.name || 'Anonymous'}</h3>
                 <p className={cn("text-2xl font-bold mt-1", styles.textColor)}>{user.points.toLocaleString()}</p>
                 <p className={cn("text-xs uppercase tracking-wider", styles.textColor, "opacity-80")}>Points</p>
            </CardContent>
        </Card>
     </Link>
  );
};
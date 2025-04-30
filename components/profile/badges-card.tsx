// components/profile/BadgesCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Award, Send, HeartHandshake, Sparkles, HelpCircle } from "lucide-react";
import { format } from "date-fns";
import { type UserBadgeData } from "@/types/user"; // Adjust path

// Icon Mapping Helper (Internal or imported from utils)
const BadgeIcon = ({ iconName, className }: { iconName: string | null; className?: string }) => {
  const sizeClass = className || "h-4 w-4";
  switch (iconName) {
    case "Send": return <Send className={sizeClass} />;
    case "HeartHandshake": return <HeartHandshake className={sizeClass} />;
    case "Sparkles": return <Sparkles className={sizeClass} />;
    default: return <HelpCircle className={sizeClass} />;
  }
};

interface BadgesCardProps {
  userBadges: UserBadgeData[] | undefined;
}

export const BadgesCard: React.FC<BadgesCardProps> = ({ userBadges }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Earned Badges</CardTitle>
        <Award className="h-5 w-5 text-blue-500" />
      </CardHeader>
      <CardContent className="pt-2 min-h-[60px]"> {/* Add min-height */}
        {userBadges && userBadges.length > 0 ? (
          <TooltipProvider delayDuration={100}>
            <div className="flex flex-wrap gap-2">
              {userBadges.map((userBadge) => (
                <Tooltip key={userBadge.badge.id}>
                  <TooltipTrigger>
                    <ShadcnBadge
                      variant="secondary"
                      className="flex items-center gap-1.5 cursor-default px-2 py-1"
                    >
                      <BadgeIcon iconName={userBadge.badge.iconName} className="h-3.5 w-3.5" />
                      <span className="text-xs">{userBadge.badge.name}</span>
                    </ShadcnBadge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-center">
                    <p className="font-semibold">{userBadge.badge.name}</p>
                    <p className="text-xs text-muted-foreground">{userBadge.badge.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Earned: {format(new Date(userBadge.earnedAt), "PP")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        ) : (
          <p className="text-sm text-muted-foreground">
            No badges earned yet. Keep contributing!
          </p>
        )}
      </CardContent>
    </Card>
  );
};
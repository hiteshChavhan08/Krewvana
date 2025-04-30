// components/profile/BadgesList.tsx (New or Refactored)
"use client";

import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Send, HeartHandshake, Sparkles, HelpCircle } from "lucide-react"; // Keep icons
import { format } from "date-fns";
import { type UserBadgeData } from "@/types/user"; // Adjust path

// Icon Mapping Helper (can be moved to utils)
const BadgeIcon = ({ iconName, className }: { iconName: string | null; className?: string }) => {
    // ... (implementation remains the same)
    const sizeClass = className || "h-4 w-4";
    switch (iconName) {
        case "Send": return <Send className={sizeClass} />;
        case "HeartHandshake": return <HeartHandshake className={sizeClass} />;
        case "Sparkles": return <Sparkles className={sizeClass} />;
        default: return <HelpCircle className={sizeClass} />;
    }
};

interface BadgesListProps {
  userBadges: UserBadgeData[] | undefined;
  className?: string; // Allow parent to pass styling
}

export const BadgesList: React.FC<BadgesListProps> = ({ userBadges, className }) => {
    // Removed Card, CardHeader, CardContent
    if (!userBadges || userBadges.length === 0) {
        return (
            <p className="text-sm text-muted-foreground py-4 px-2"> {/* Adjust padding */}
                No badges earned yet.
            </p>
        );
    }

    return (
        <TooltipProvider delayDuration={100}>
            <div className={`flex flex-wrap gap-2 ${className || 'pt-2'}`}> {/* Apply className or default padding */}
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
    );
};
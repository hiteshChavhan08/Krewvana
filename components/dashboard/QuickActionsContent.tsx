// components/dashboard/QuickActionsContent.tsx
"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GiveKudosDialog } from "@/components/kudos/GiveKudosDialog"; // Adjust path
import { PartyPopper, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsContentProps {
    className?: string;
}

export const QuickActionsContent: React.FC<QuickActionsContentProps> = ({ className }) => {
  return (
    // Removed Card wrappers
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <GiveKudosDialog />
      <Button variant="outline" size="sm" asChild>
        <Link href="/app/shoutouts"> {/* Adjust path */}
          <PartyPopper className="mr-2 h-4 w-4" /> Post Shoutout
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href="/app/innovation"> {/* Adjust path */}
          <Lightbulb className="mr-2 h-4 w-4" /> Submit Idea
        </Link>
      </Button>
      {/* Add more actions */}
    </div>
  );
};
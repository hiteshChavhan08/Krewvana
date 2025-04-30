// components/profile/PointsDisplay.tsx (New or Refactored)
"use client";

import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text"; // Adjust path
import { cn } from "@/lib/utils"; // Adjust path
import { NumberTicker } from "../magicui/number-ticker";

interface PointsDisplayProps {
  points: number;
  className?: string;
}

export const PointsDisplay: React.FC<PointsDisplayProps> = ({
  points,
  className,
}) => {
  return (
    // Removed the Card, CardHeader, CardContent wrappers
    // Apply centering and styles directly if needed, or let parent control layout
    <div className={cn("flex items-center justify-center", className)}>
      <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
        <span className="text-5xl font-bold tracking-tighter whitespace-nowrap">
          {/* {points?.toLocaleString() ?? 0} */}
          <NumberTicker value={points ?? 0} />
        </span>
      </AnimatedShinyText>
    </div>
  );
};

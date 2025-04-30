// components/profile/PointsCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text"; // Adjust path
import { Star } from "lucide-react";

interface PointsCardProps {
  points: number;
}

export const PointsCard: React.FC<PointsCardProps> = ({ points }) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Points</CardTitle>
        <Star className="h-5 w-5 text-yellow-500" />
      </CardHeader>
      <CardContent className="flex items-center justify-center pt-2">
        {/* Optional: Add background gradient if desired */}
        {/* <div className={cn("z-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg p-1")}> */}
        <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
          <span className="text-5xl font-bold tracking-tighter">
            {points?.toLocaleString() ?? 0}
          </span>
        </AnimatedShinyText>
        {/* </div> */}
      </CardContent>
    </Card>
  );
};

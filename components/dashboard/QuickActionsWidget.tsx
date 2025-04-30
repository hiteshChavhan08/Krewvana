// components/dashboard/QuickActionsWidget.tsx
"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GiveKudosDialog } from "@/components/kudos/GiveKudosDialog"; // Adjust path
import { PartyPopper, Lightbulb } from "lucide-react";

export const QuickActionsWidget = () => {
  return (
    <Card>
      <CardHeader className="pb-2"> {/* Reduce padding */}
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3 pt-2"> {/* Adjust padding */}
        {/* TODO: Pass necessary props/callbacks if GiveKudosDialog needs them */}
        <GiveKudosDialog />
        <Button variant="outline" size="sm" asChild>
          <Link href="/app/shoutouts">
            <PartyPopper className="mr-2 h-4 w-4" /> Post Shoutout
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/app/innovation"> {/* Assuming this path */}
            <Lightbulb className="mr-2 h-4 w-4" /> Submit Idea
          </Link>
        </Button>
        {/* Add other actions */}
      </CardContent>
    </Card>
  );
};
// app/app/kudos/page.tsx
"use client";

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GiveKudosDialog } from "@/components/kudos/GiveKudosDialog";
import { KudosCard } from "@/components/kudos/KudosCard";
import { KudosSkeletonCard } from "@/components/kudos/KudosSkeletonCard";
import { Terminal, Info, ThumbsUp } from "lucide-react";
import { useKudosFeed } from "@/hooks/useKudosFeed"; // Import the custom hook
import { type KudosData } from "@/types/kudos"; // Adjust path if needed

// Import UI Enhancements
import { TracingBeam } from "@/components/ui/tracing-beam"; // Keep for now
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button"; // Keep for potential error state button
import { Card } from "@/components/ui/card"; // Use Card for better empty/error state UI

export default function KudosFeedPage() {
  // Use the custom hook for data fetching
  const { data: kudosFeed, isLoading, error, isError } = useKudosFeed();

  return (
    // Remove DotPattern for now to test TracingBeam
    <div className="relative w-full">
      {/* Main container with padding */}
      {/* NOTE: TracingBeam often works best when it's wrapping the direct scrolling container */}
      {/* Let's apply TracingBeam later if the simpler structure works */}
      <div className="container mx-auto max-w-2xl py-8 px-4">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
          {/* Use a standard h1, AnimatedShinyText might be too much here */}
          <h1 className="text-3xl font-bold tracking-tight text-center sm:text-left">
            Kudos Feed
          </h1>
          {/* Give Kudos Dialog Trigger */}
          <GiveKudosDialog
            trigger={
              <div
                className={cn(
                  "group rounded-full border border-border bg-background text-base text-foreground transition-all ease-in hover:cursor-pointer hover:bg-muted" // Use theme colors
                )}
              >
                <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out group-hover:text-primary dark:group-hover:text-primary">
                  <span className="flex items-center gap-1.5">
                    <ThumbsUp className="h-4 w-4" /> Give Kudos
                  </span>
                </AnimatedShinyText>
              </div>
            }
          />
        </div>

        {/* Content Area */}
        {/* We'll wrap the list itself with TracingBeam if needed */}
        <div className="relative">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-6 md:space-y-8">
              {" "}
              {/* Consistent spacing */}
              {[...Array(5)].map((_, i) => (
                <KudosSkeletonCard key={`skel-${i}`} />
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <Card className="mt-6 border-destructive/50 bg-destructive/5">
              <Alert variant="destructive" className="border-none p-6">
                <Terminal className="h-5 w-5" />
                <AlertTitle className="text-lg mb-1">
                  Error Loading Feed
                </AlertTitle>
                <AlertDescription>
                  Could not load Kudos. Please try refreshing the page.
                  <br />
                  <span className="text-xs opacity-80">
                    ({error?.message || "Unknown error"})
                  </span>
                </AlertDescription>
                {/* Optional: Add a retry button if feasible */}
                {/* <Button variant="destructive" size="sm" className="mt-4" onClick={() => queryClient.refetchQueries(['kudosFeed'])}>Retry</Button> */}
              </Alert>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && !isError && kudosFeed && kudosFeed.length === 0 && (
            <Card className="text-center py-12 px-6 border-2 border-dashed rounded-lg mt-6 bg-card/80">
              <Info className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                It's quiet here...
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Be the first to share some appreciation!
              </p>
              {/* The main button is already visible */}
            </Card>
          )}

          {/* Feed Content - Attempt TracingBeam Here */}
          {/* TracingBeam needs a direct child container for the list */}
          {!isLoading && !isError && kudosFeed && kudosFeed.length > 0 && (
            <TracingBeam className="">
              {/* Adjust padding/margin if needed */}
              {/* No extra space-y needed here if KudosCard has margin */}
              <div className="max-w-2xl mx-auto antialiased pt-4 relative">
                {kudosFeed.map((kudos) => (
                  <KudosCard key={kudos.id} kudos={kudos} />
                ))}
              </div>
            </TracingBeam>
          )}
        </div>
      </div>
    </div>
  );
}

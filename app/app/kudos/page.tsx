// app/app/kudos/page.tsx
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { GiveKudosDialog } from '@/components/kudos/GiveKudosDialog'; // Import Dialog
import { KudosCard } from '@/components/kudos/KudosCard';         // Import Updated Card (no wrapper)
import { KudosSkeletonCard } from '@/components/kudos/KudosSkeletonCard'; // Import Updated Skeleton
import { Terminal, Info, ThumbsUp } from 'lucide-react';
import { type KudosData } from '@/types/kudos'; // Import type (adjust path)

// Import UI Enhancements (Ensure paths are correct)
import { TracingBeam } from '@/components/ui/tracing-beam';
import { DotPattern } from '@/components/magicui/dot-pattern';
import { AnimatedShinyText } from '@/components/magicui/animated-shiny-text';
import { cn } from '@/lib/utils';

// --- API Fetch Function ---
// Assuming this exists elsewhere or define it here
async function fetchKudosFeed(): Promise<KudosData[]> {
  const response = await fetch('/api/kudos');
  if (!response.ok) {
    console.error("Kudos API Error:", response.status, await response.text());
    throw new Error('Failed to fetch Kudos feed');
  }
  const data = await response.json();
  // Ensure the data matches the KudosData structure
  return data as KudosData[];
}


// --- Main Page Component ---
export default function KudosFeedPage() {
  const { data: kudosFeed, isLoading, error, isError } = useQuery<KudosData[]>({
    queryKey: ['kudosFeed'],
    queryFn: fetchKudosFeed,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  });

  return (
    // Add relative positioning and overflow hidden for DotPattern
    <div className="relative w-full"> {/* Ensure min height */}
        {/* <DotPattern
            width={25} height={25} cx={1} cy={1} cr={1}
            className={cn(
                "[mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)]",
                "absolute inset-0 z-0 opacity-10 dark:opacity-5" // Made even more subtle
            )}
        /> */}
        {/* Main container with padding */}
        <div className="relative z-10 container mx-auto max-w-2xl py-8 px-4">

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-center sm:text-left">
                    Kudos Feed
                </h1>

                {/* Give Kudos Button with Dialog */}
                {/* Pass the AnimatedShinyText as the trigger prop */}
                <GiveKudosDialog
                     trigger={
                        <div className={cn(
                            "group rounded-full border border-black/5 bg-neutral-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                        )}>
                            <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
                                <span className="flex items-center gap-1.5"> {/* Slightly more gap */}
                                    <ThumbsUp className="h-4 w-4" /> Give Kudos
                                </span>
                            </AnimatedShinyText>
                        </div>
                     }
                 />
            </div>

            {/* Loading State */}
            {isLoading && (
                <TracingBeam className="px-0"> {/* Use TracingBeam for loading state too */}
                    <div className="space-y-6">
                        {[...Array(5)].map((_, i) => (
                            <KudosSkeletonCard key={`skel-${i}`} />
                        ))}
                    </div>
                </TracingBeam>
            )}

            {/* Error State */}
            {isError && (
                <Alert variant="destructive" className="mt-6">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error Loading Feed</AlertTitle>
                    <AlertDescription>
                        Could not load Kudos. Please try refreshing the page. ({error?.message})
                    </AlertDescription>
                </Alert>
            )}

            {/* Empty State */}
            {!isLoading && !isError && kudosFeed && kudosFeed.length === 0 && (
                <div className="text-center py-16 px-6 border-2 border-dashed rounded-lg mt-6 bg-background/50"> {/* Added subtle background */}
                   <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" /> {/* Larger icon */}
                   <p className="text-xl font-medium text-muted-foreground">It's quiet here...</p>
                   <p className="text-sm text-muted-foreground mt-2">Why not be the first to share some appreciation?</p>
                   {/* Optional: Add Give Kudos button here too? */}
                   {/* <GiveKudosDialog trigger={<Button size="sm" className="mt-4">Give Kudos</Button>} /> */}
                </div>
            )}

            {/* Feed Content within TracingBeam */}
            {!isLoading && !isError && kudosFeed && kudosFeed.length > 0 && (
                <TracingBeam className="px-0">
                    <div className="space-y-0"> {/* KudosCard handles margin */}
                        {kudosFeed.map((kudos) => (
                            <KudosCard key={kudos.id} kudos={kudos} />
                        ))}
                        {/* Optional: Add pagination or "Load More" button/trigger */}
                    </div>
                </TracingBeam>
            )}
        </div>
    </div>
  );
}
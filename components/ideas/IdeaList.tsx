// components/ideas/IdeaList.tsx
'use client';
import React from 'react';
import Link from 'next/link'; // <--- IMPORT Link from Next.js
import { IdeaCard } from './IdeaCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, Terminal, Loader2, ListFilter, ArrowDownUp } from 'lucide-react';
import { AnimatedList } from '@/components/magicui/animated-list'; // Assuming this is correctly imported
import { Idea } from '@/hooks/ideas/useIdeas'; // Your Idea type
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface IdeaListProps {
  ideas: Idea[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onSortChange: (sortBy: 'createdAt' | 'votes', order: 'asc' | 'desc') => void;
  currentSort: { sortBy: 'createdAt' | 'votes', order: 'asc' | 'desc' };
}

export function IdeaList({
  ideas,
  isLoading,
  isError,
  error,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  onSortChange,
  currentSort,
}: IdeaListProps) {

  const sortOptions = [
    { label: "Newest First", value: { sortBy: 'createdAt', order: 'desc' } },
    { label: "Oldest First", value: { sortBy: 'createdAt', order: 'asc' } },
    { label: "Most Votes", value: { sortBy: 'votes', order: 'desc' } },
    { label: "Fewest Votes", value: { sortBy: 'votes', order: 'asc' } },
  ] as const;

  if (isLoading && !ideas.length) {
    // ... (skeleton UI remains the same)
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col space-y-3">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    // ... (error UI remains the same)
    return (
      <Alert variant="destructive" className="max-w-xl mx-auto">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error Loading Ideas</AlertTitle>
        <AlertDescription>{error?.message || 'An unknown error occurred.'}</AlertDescription>
      </Alert>
    );
  }

  if (!isLoading && !ideas.length && !hasNextPage) {
    // ... (no ideas UI remains the same)
     return (
      <Alert className="max-w-xl mx-auto text-center py-10">
        <Info className="h-6 w-6 mx-auto mb-2" />
        <AlertTitle className="text-xl font-semibold">No Ideas Pitched Yet!</AlertTitle>
        <AlertDescription>Be the first to share an innovative idea with the Kanaka team.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
        <div className="flex justify-end">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-1.5">
                        <ListFilter className="h-4 w-4" />
                        Sort by: {sortOptions.find(opt => opt.value.sortBy === currentSort.sortBy && opt.value.order === currentSort.order)?.label || "Default"}
                        <ArrowDownUp className="h-3 w-3 text-muted-foreground" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Sort Ideas</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {sortOptions.map(opt => (
                         <DropdownMenuItem
                            key={opt.label}
                            onClick={() => onSortChange(opt.value.sortBy, opt.value.order)}
                            className={currentSort.sortBy === opt.value.sortBy && currentSort.order === opt.value.order ? "bg-accent" : ""}
                         >
                            {opt.label}
                         </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        {/* Ensure AnimatedList does not interfere with Link behavior. 
            If AnimatedList renders complex DOM that breaks anchor tags, you might need to adjust.
            Typically, it should be fine. */}
        <AnimatedList delay={100}> {/* Assuming AnimatedList renders its children directly or within a simple wrapper */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {ideas.map((idea) => (
                  // --- WRAP IdeaCard with Link ---
                  <Link key={idea.id} href={`/app/ideas/${idea.id}`} passHref className="block h-full">
                    {/* passHref is useful if IdeaCard's root element isn't an <a> tag itself.
                        legacyBehavior={false} is the default in newer Next.js but good to be explicit.
                        Added className="block h-full" to make the link take up the full card space.
                        IdeaCard itself should be structured to fill this space.
                    */}
                    <IdeaCard idea={idea} />
                  </Link>
                ))}
            </div>
        </AnimatedList>

        {hasNextPage && (
            <div className="text-center mt-10">
            <Button
                onClick={() => fetchNextPage?.()}
                disabled={isFetchingNextPage}
                variant="outline"
                size="lg"
            >
                {isFetchingNextPage ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : null}
                {isFetchingNextPage ? 'Loading More Ideas...' : 'Load More Ideas'}
            </Button>
            </div>
        )}
    </div>
  );
}
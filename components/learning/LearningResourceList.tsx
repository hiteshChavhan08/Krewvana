// components/learning/LearningResourceList.tsx
'use client';
import React from 'react';
import { LearningResourceCard } from './LearningResourceCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, Terminal, Loader2 } from 'lucide-react';
import { AnimatedList } from '@/components/magicui/animated-list'; // Assuming this path
import { LearningResource } from '@/hooks/learning/useLearningResources'; // Import the type

interface LearningResourceListProps {
  resources: LearningResource[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

export function LearningResourceList({
  resources,
  isLoading,
  isError,
  error,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: LearningResourceListProps) {

  if (isLoading && !resources.length) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-full rounded-xl" />
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
    return (
      <Alert variant="destructive" className="max-w-xl mx-auto">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error Loading Resources</AlertTitle>
        <AlertDescription>{error?.message || 'An unknown error occurred.'}</AlertDescription>
      </Alert>
    );
  }

  if (!resources.length) {
    return (
      <Alert className="max-w-xl mx-auto">
        <Info className="h-4 w-4" />
        <AlertTitle>No Resources Yet</AlertTitle>
        <AlertDescription>Be the first to share something valuable with the team!</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatedList> {/* Apply Magic UI AnimatedList here */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource, idx) => (
            <LearningResourceCard key={resource.id || idx} resource={resource} />
            ))}
        </div>
      </AnimatedList>
      {hasNextPage && (
        <div className="text-center mt-8">
          <Button
            onClick={() => fetchNextPage?.()}
            disabled={isFetchingNextPage}
            variant="outline"
          >
            {isFetchingNextPage ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isFetchingNextPage ? 'Loading more...' : 'Load More Resources'}
          </Button>
        </div>
      )}
    </div>
  );
}
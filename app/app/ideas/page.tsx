// app/app/ideas/page.tsx
import React from 'react';
import { IdeaPageClient } from './IdeaPageClient';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
// fetchIdeasAPI IS the function that fetches data, it's correctly used here.
import { fetchIdeasAPI } from '@/hooks/ideas/useIdeas'; // Make sure this path is correct and it's exported
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';
import { BrainCircuit } from 'lucide-react';

export default async function IdeasPage() {
  const queryClient = new QueryClient();
  const titleWords = "Kanaka Idea Wall";
  const defaultSortBy = 'createdAt'; // Default sort for prefetching
  const defaultOrder = 'desc';     // Default order

  await queryClient.prefetchInfiniteQuery({
    // The queryKey must exactly match the one used in the useIdeas hook on the client
    queryKey: ['ideas', defaultSortBy, defaultOrder],
    // queryFn receives an object with pageParam. We pass it to fetchIdeasAPI.
    queryFn: ({ pageParam }) => fetchIdeasAPI({ pageParam, sortBy: defaultSortBy, order: defaultOrder }),
    initialPageParam: 1,
    // You can also specify how many pages to prefetch, though 1 is common for initial load
    // pages: 1,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="container mx-auto py-8 px-4 space-y-10">
        <div className="text-center">
          <BrainCircuit className="h-16 w-16 text-primary mx-auto mb-4" />
          <TextGenerateEffect words={titleWords} className="text-4xl font-bold mb-2" />
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Share your brilliant ideas, vote on your favorites, and let's innovate together!
          </p>
        </div>
        <IdeaPageClient />
      </div>
    </HydrationBoundary>
  );
}
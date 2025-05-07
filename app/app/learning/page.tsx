// app/app/learning/page.tsx
// No changes needed from the previous version for this specific UI redesign
import React from 'react';
import { LearningPageClient } from "@/components/learning/LearningPageClient";
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { fetchLearningResourcesAPI } from '@/hooks/learning/useLearningResources'; 
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'; // Assuming this path

export default async function LearningPage() {
  const queryClient = new QueryClient();
  const titleWords = "Kanaka Learning Hub";

  await queryClient.prefetchInfiniteQuery({
    queryKey: ['learningResources'],
    queryFn: ({ pageParam }) => fetchLearningResourcesAPI({ pageParam }), 
    initialPageParam: 1,
  });
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
        <div className="container mx-auto py-8 px-4 space-y-10">
            {/* Page Title - remains the same */}
            <TextGenerateEffect words={titleWords} className="text-4xl font-bold text-center mb-2" />
            {/* The client component now handles the new layout */}
            <LearningPageClient />
        </div>
    </HydrationBoundary>
  );
}
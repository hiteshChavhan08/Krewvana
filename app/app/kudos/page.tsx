// app/kudos/page.tsx
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { KudosCard } from '@/components/kudos/KudosCard'; // We'll create this next
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react'; // Example icon for alert

// --- API Fetch Function ---
async function fetchKudosFeed(): Promise<any[]> { // Replace 'any' with proper Kudos type later
  const response = await fetch('/api/kudos');
  if (!response.ok) {
    throw new Error('Failed to fetch Kudos feed');
  }
  return response.json();
}

export default function KudosFeedPage() {
  const { data: kudosFeed, isLoading, error, isError } = useQuery({
    queryKey: ['kudosFeed'], // Unique key for this query
    queryFn: fetchKudosFeed,
    // Optional: Add staleTime or refetchInterval if needed
    // staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Kudos Feed</h1>

      {isLoading && (
        <div className="space-y-4">
          {/* Show skeleton loaders */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg flex space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
         <Alert variant="destructive">
           <Terminal className="h-4 w-4" /> {/* Example icon */}
           <AlertTitle>Error</AlertTitle>
           <AlertDescription>
             Could not load the Kudos feed. Please try again later. ({error?.message})
           </AlertDescription>
         </Alert>
      )}

      {!isLoading && !isError && kudosFeed && kudosFeed.length === 0 && (
        <p className="text-center text-gray-500">No Kudos given yet. Be the first!</p>
      )}

      {!isLoading && !isError && kudosFeed && kudosFeed.length > 0 && (
        <div className="space-y-4">
          {kudosFeed.map((kudos) => (
            <KudosCard key={kudos.id} kudos={kudos} />
          ))}
        </div>
      )}
    </div>
  );
}
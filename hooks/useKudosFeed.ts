// hooks/useKudosFeed.ts (Create this new file)
import { useQuery } from '@tanstack/react-query';
import { type KudosData } from '@/types/kudos'; // Adjust path

// API Fetch Function
async function fetchKudosFeed(): Promise<KudosData[]> {
  const response = await fetch('/api/kudos'); // Ensure this endpoint exists and returns KudosData[]
  if (!response.ok) {
    console.error("Kudos API Error:", response.status, await response.text().catch(()=>""));
    // Provide a more specific error message if possible from response body
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch Kudos feed');
  }
  const data = await response.json();
  // Add runtime validation here if desired (e.g., with Zod)
  return data as KudosData[];
}

// Custom Hook
export function useKudosFeed() {
  return useQuery<KudosData[], Error>({ // Explicitly type the Error
    queryKey: ['kudosFeed'],
    queryFn: fetchKudosFeed,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
    refetchOnWindowFocus: false, // Optional: prevent refetch on window focus
  });
}
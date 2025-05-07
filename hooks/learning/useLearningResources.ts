// hooks/learning/useLearningResources.ts
import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query'; // Import InfiniteData

export interface LearningResource {
  id: string;
  title: string;
  url: string;
  description?: string | null;
  submittedAt: string;
  submittedBy: { id: string; name: string | null; image: string | null } | null;
}

export interface PaginatedLearningResources {
  data: LearningResource[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalResources: number;
  };
}

// Ensure pageParam in the function signature is typed
export async function fetchLearningResourcesAPI({ pageParam = 1 }: { pageParam?: number }): Promise<PaginatedLearningResources> {
  const res = await fetch(`/api/learning/resources?page=${pageParam}&limit=5`); // Example limit
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Failed to fetch resources' }));
    throw new Error(errorData.error || 'Failed to fetch resources');
  }
  return res.json();
}

export function useLearningResources() {
  return useInfiniteQuery<
    PaginatedLearningResources,                     // TQueryFnData: Type of data returned by queryFn for one page
    Error,                                          // TError
    InfiniteData<PaginatedLearningResources, number>,// TData: Type of the 'data' property in the hook's result (this was the main fix)
    ['learningResources'],                          // TQueryKey: Explicit type for queryKey
    number                                          // TPageParam: Type of the page parameter
  >({
    queryKey: ['learningResources'],
    queryFn: fetchLearningResourcesAPI,
    getNextPageParam: (lastPage: PaginatedLearningResources) => { // lastPage is PaginatedLearningResources
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1, // This is TPageParam
  });
}
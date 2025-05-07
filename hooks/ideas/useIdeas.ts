// hooks/ideas/useIdeas.ts
import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query';

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: string[];
  status: string; // IdeaStatus enum as string
  submittedById: string;
  submittedBy: { id: string; name: string | null; image: string | null } | null;
  createdAt: string;
  updatedAt: string;
  // Added by API processing:
  currentUserVoted: boolean;
  voteCount: number;
}

export interface PaginatedIdeas {
  data: Idea[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalIdeas: number;
  };
}

interface FetchIdeasParams {
  pageParam?: number;
  sortBy?: 'createdAt' | 'votes';
  order?: 'asc' | 'desc';
}

export async function fetchIdeasAPI({ pageParam = 1, sortBy = 'createdAt', order = 'desc' }: FetchIdeasParams): Promise<PaginatedIdeas> {
  const res = await fetch(`/api/ideas?page=${pageParam}&limit=10&sortBy=${sortBy}&order=${order}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Failed to fetch ideas' }));
    throw new Error(errorData.error || 'Failed to fetch ideas');
  }
  return res.json();
}

export function useIdeas({ sortBy = 'createdAt', order = 'desc' }: { sortBy?: 'createdAt' | 'votes', order?: 'asc' | 'desc' } = {}) {
  return useInfiniteQuery<
    PaginatedIdeas,
    Error,
    InfiniteData<PaginatedIdeas, number>,
    ['ideas', string, string], // QueryKey: ['ideas', sortBy, order]
    number
  >({
    queryKey: ['ideas', sortBy, order],
    queryFn: ({ pageParam }) => fetchIdeasAPI({ pageParam, sortBy, order }),
    getNextPageParam: (lastPage: PaginatedIdeas) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}
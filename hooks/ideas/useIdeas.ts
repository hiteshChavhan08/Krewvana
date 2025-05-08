// hooks/ideas/useIdeas.ts
import { IdeaUpdateAPIData } from '@/lib/schemas';
import { toastError, toastSuccess } from '@/utils/toast';
import { useQuery, useInfiniteQuery, InfiniteData, useQueryClient, useMutation } from '@tanstack/react-query'; // Ensure InfiniteData is imported


export interface IdeaAuthor {
  id: string;
  name: string | null;
  image: string | null;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: string[];
  status: string; // Or your IdeaStatus enum
  submittedById: string;
  submittedBy: IdeaAuthor; // Make sure this is the full object if needed by IdeaCard
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  currentUserVoted?: boolean; // Optional, as it depends on current user session
  voteCount: number;
  commentCount?: number; // Add this if you want it on cards too
   // _count?: { // If you prefer to keep the raw count structure
  //   votes: number;
  //   comments?: number;
  // };
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


// --- Existing useIdeas hook for lists (ensure Idea type above is used) ---
export const fetchIdeasAPI = async ({
  pageParam = 1,
  limit = 9, // Or your default
  sortBy = 'createdAt',
  order = 'desc',
}: {
  pageParam?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'votes';
  order?: 'asc' | 'desc';
}): Promise<PaginatedIdeas> => {
  const response = await fetch(
    `/api/ideas?page=${pageParam}&limit=${limit}&sortBy=${sortBy}&order=${order}`
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch ideas' }));
    throw new Error(errorData.error || 'Failed to fetch ideas');
  }
  return response.json();
};

export function useIdeas({
  sortBy = 'createdAt',
  order = 'desc',
  limit = 9,
}: {
  sortBy?: 'createdAt' | 'votes';
  order?: 'asc' | 'desc';
  limit?: number;
}) {
  return useInfiniteQuery<
    PaginatedIdeas,
    Error,
    InfiniteData<PaginatedIdeas, number>,
    readonly [string, string, string], // Adjusted queryKey type
    number
  >({
    queryKey: ['ideas', sortBy, order] as const,
    queryFn: ({ pageParam }) => fetchIdeasAPI({ pageParam, sortBy, order, limit }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}


// --- NEW: For fetching a single idea ---
export interface IdeaDetail extends Idea { // Extending the base Idea type
  // Add any fields specific to the detail view that are NOT in the base Idea type.
  // If your API for a single idea adds more, like a more detailed 'submittedBy',
  // or specific calculated fields, define them here.
  // For now, if it's the same structure as 'Idea' but guaranteed to be one item,
  // 'Idea' itself might be sufficient, but 'IdeaDetail' provides clarity.
  // Example: if description was truncated in Idea, but full in IdeaDetail
  // fullDescription: string;
  // Ensure your API for GET /api/ideas/[ideaId] returns this structure.
}

export const fetchIdeaByIdAPI = async (ideaId: string): Promise<IdeaDetail> => {
  const response = await fetch(`/api/ideas/${ideaId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch idea details' }));
    throw new Error(errorData.error || 'Failed to fetch idea details');
  }
  return response.json(); // This should return data matching IdeaDetail
};

export function useIdea(ideaId: string) {
  return useQuery<IdeaDetail, Error, IdeaDetail, readonly [string, string]>({
    queryKey: ['idea', ideaId] as const,
    queryFn: () => fetchIdeaByIdAPI(ideaId),
    enabled: !!ideaId,
  });
}

// --- Hook to Update an Idea ---
const updateIdeaAPI = async ({ ideaId, data }: { ideaId: string, data: IdeaUpdateAPIData }): Promise<IdeaDetail> => {
  const response = await fetch(`/api/ideas/${ideaId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to update idea' }));
    throw new Error(errorData.error || 'Failed to update idea');
  }
  return response.json(); // API should return the updated IdeaDetail
};

export function useUpdateIdea() {
  const queryClient = useQueryClient();

  return useMutation<IdeaDetail, Error, { ideaId: string; data: IdeaUpdateAPIData }>({
    mutationFn: updateIdeaAPI,
    onSuccess: (updatedIdeaData, variables) => {
      toastSuccess('Idea updated successfully!');

      // Invalidate and refetch the single idea query
      queryClient.invalidateQueries({ queryKey: ['idea', variables.ideaId] });

      // Optimistically update the idea in the ideas list cache (if you want)
      // This is more complex as you need to find and update the specific idea in potentially multiple pages
      queryClient.setQueryData<InfiniteData<PaginatedIdeas, number>>(
        // Match the queryKey used by useIdeas (e.g., including sort order)
        // This example assumes a simple queryKey for the list; adjust as needed.
        // You might need to invalidate all 'ideas' queries if keys are dynamic: queryClient.invalidateQueries({ queryKey: ['ideas'] });
        ['ideas'], // Adjust this queryKey to match your useIdeas hook's key
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map(page => ({
              ...page,
              data: page.data.map(idea =>
                idea.id === variables.ideaId ? { ...idea, ...updatedIdeaData } : idea
              ),
            })),
          };
        }
      );
    },
    onError: (error) => {
      toastError(error.message || 'Could not update idea.');
    },
  });
}

// --- Hook to Delete an Idea ---
const deleteIdeaAPI = async (ideaId: string): Promise<{ message: string }> => {
  const response = await fetch(`/api/ideas/${ideaId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to delete idea' }));
    throw new Error(errorData.error || 'Failed to delete idea');
  }
  return response.json();
};

export function useDeleteIdea() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string, unknown>({ // Third generic is variables (ideaId: string)
    mutationFn: deleteIdeaAPI, // Receives ideaId string
    onSuccess: (data, ideaId) => { // 'variables' here is the ideaId
      toastSuccess(data.message || 'Idea deleted successfully!');

      // Remove the idea from the single idea query cache if it exists
      queryClient.removeQueries({ queryKey: ['idea', ideaId] });

      // Remove the idea from the ideas list cache
      // Similar to update, adjust queryKey. Invalidate is often simpler.
      queryClient.invalidateQueries({ queryKey: ['ideas'] }); // Simplest way to refetch lists
      
      // More complex optimistic removal from list:
      // queryClient.setQueryData<InfiniteData<PaginatedIdeas, number>>(
      //   ['ideas'], // Adjust this queryKey
      //   (oldData) => {
      //     if (!oldData) return oldData;
      //     return {
      //       ...oldData,
      //       pages: oldData.pages.map(page => ({
      //         ...page,
      //         data: page.data.filter(idea => idea.id !== ideaId),
      //       })),
      //     };
      //   }
      // );
    },
    onError: (error: { message: any; }) => {
      toastError(error.message || 'Could not delete idea.');
    },
  });
}
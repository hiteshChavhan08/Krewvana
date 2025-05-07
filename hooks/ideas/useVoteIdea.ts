// hooks/ideas/useVoteIdea.ts
import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Idea, PaginatedIdeas } from './useIdeas'; // Assuming Idea type is defined here
import { toastSuccess } from '@/utils/toast';

interface VoteResponse {
  message: string;
  ideaId: string;
  voteCount: number;
  currentUserVoted: boolean;
}

async function voteIdeaAPI(ideaId: string): Promise<VoteResponse> {
  const res = await fetch(`/api/ideas/${ideaId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // No body needed for this specific toggle vote
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Failed to process vote' }));
    throw new Error(errorData.error || 'Failed to process vote');
  }
  return res.json();
}

export function useVoteIdea() {
  const queryClient = useQueryClient();

  return useMutation<VoteResponse, Error, string>({ // string is ideaId
    mutationFn: voteIdeaAPI,
    onSuccess: (data, ideaIdVoted) => {
      toastSuccess("Idea Created!",data.message);
      const queryKeysToUpdate = queryClient.getQueryCache().findAll({ queryKey: ['ideas'], exact: false });
      // Optimistically update the specific idea in the cache
      queryKeysToUpdate.forEach(query => {
        const queryKey = query.queryKey;
        queryClient.setQueryData<InfiniteData<PaginatedIdeas, number>>(queryKey, (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map(page => ({
              ...page,
              data: page.data.map((idea: Idea) =>
                idea.id === ideaIdVoted // Use the ideaId that was voted on
                  ? { ...idea, voteCount: data.voteCount, currentUserVoted: data.currentUserVoted }
                  : idea
              ),
            })),
          };
        });
      });

       // Also invalidate if you have specific sorting by 'votes' active
    //    queryClient.invalidateQueries({ queryKey: ['ideas', 'votes'] });
    },
    onError: (error: Error) => {
      toast.error('Vote Failed', { description: error.message });
    },
  });
}
// hooks/ideas/useSubmitIdea.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { IdeaCreateData } from '@/lib/schemas';
import { Idea } from './useIdeas'; // Assuming Idea type is defined in useIdeas.ts

async function submitIdeaAPI(data: IdeaCreateData): Promise<Idea> {
  const res = await fetch('/api/ideas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.details?.[0]?.message || errorData.error || 'Failed to submit idea');
  }
  return res.json();
}

export function useSubmitIdea() {
  const queryClient = useQueryClient();

  return useMutation<Idea, Error, IdeaCreateData>({
    mutationFn: submitIdeaAPI,
    onSuccess: (newIdea) => {
      toast.success('Idea Submitted!', { description: 'Thanks for sharing your innovative thought!' });
      // Invalidate queries to refetch the list and show the new idea
      queryClient.invalidateQueries({ queryKey: ['ideas'] }); 
      // Optionally, optimistically add to the list (more complex for infinite scroll)
    },
    onError: (error: Error) => {
      toast.error('Submission Failed', { description: error.message });
    },
  });
}
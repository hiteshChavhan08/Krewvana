// components/qna/useVoteMutation.ts
"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { VoteType } from '@prisma/client'; // Import enum

type VoteEntityType = 'question' | 'answer';

// API function (ideally move to api service file)
async function postVoteApi(payload: { entityType: VoteEntityType, entityId: string, voteType: VoteType }) {
    const { entityType, entityId, voteType } = payload;
    const apiUrl = entityType === 'question'
        ? `/api/questions/${entityId}/vote`
        : `/api/answers/${entityId}/vote`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${voteType === 'UPVOTE' ? 'upvote' : 'vote'}`);
    }
    return response.json(); // Expect backend to return updated counts/status
}

export function useVoteMutation(entityType: VoteEntityType, entityId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { voteType: VoteType }) => postVoteApi({ entityType, entityId, ...data }),
        onSuccess: (data, variables) => {
            // Optimistic update or simple invalidation
            toast.success(variables.voteType === 'UPVOTE' ? "Upvoted!" : "Vote registered!"); // Adjust message

            // Invalidate the question details query to refetch vote counts/status
            if (entityType === 'question') {
                queryClient.invalidateQueries({ queryKey: ['questionDetails', entityId] });
            } else {
                // If voting on an answer, we still need to refetch the whole question
                // Find the questionId associated with the answerId if possible,
                // otherwise, invalidate all questionDetails (less efficient)
                // For now, invalidate the current question if entityId is likely the answer's question
                const questionId = queryClient.getQueryData<DetailedQuestion>(['questionDetails', window.location.pathname.split('/').pop()])?.id;
                if(questionId) {
                     queryClient.invalidateQueries({ queryKey: ['questionDetails', questionId] });
                } else {
                     queryClient.invalidateQueries({ queryKey: ['questionDetails'] }); // Fallback
                }

            }
        },
        onError: (error: Error) => {
            toast.error("Vote Failed", { description: error.message });
        },
    });
}

// Need DetailedQuestion type available here for queryClient invalidation example
import type { DetailedQuestion } from '@/lib/qna';
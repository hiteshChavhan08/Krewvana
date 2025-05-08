// hooks/ideas/useIdeaComments.ts
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { IdeaCommentCreateData } from "@/lib/schemas"; // Adjust path if needed
import { toastSuccess, toastError } from "@/utils/toast"; // Your toast utilities

// Define the structure of a comment as expected from the API
// This should match the 'include' in your API response
export interface IdeaCommentAuthor {
  id: string;
  name: string | null;
  image: string | null;
}

export interface IdeaComment {
  id: string;
  content: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  authorId: string;
  author: IdeaCommentAuthor;
  ideaId: string;
  // replies?: IdeaComment[]; // If you add threaded replies
  // _count?: { replies: number };
}

export interface PaginatedIdeaComments {
  data: IdeaComment[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

export const fetchIdeaCommentsAPI = async ({
  ideaId,
  pageParam = 1,
  limit = 10,
}: {
  ideaId: string;
  pageParam?: number;
  limit?: number;
}): Promise<PaginatedIdeaComments> => {
  const response = await fetch(
    `/api/ideas/${ideaId}/comments?page=${pageParam}&limit=${limit}`
  );
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Failed to fetch comments" }));
    throw new Error(errorData.error || "Failed to fetch comments");
  }
  return response.json();
};

export function useIdeaComments(ideaId: string, limit: number = 10) {
  return useInfiniteQuery<
    PaginatedIdeaComments,
    Error,
    InfiniteData<PaginatedIdeaComments, number>,
    readonly [string, string],
    number
  >({
    queryKey: ["ideaComments", ideaId] as const,
    queryFn: ({ pageParam }) =>
      fetchIdeaCommentsAPI({ ideaId, pageParam, limit }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!ideaId, // Only run if ideaId is available
  });
}

const submitIdeaCommentAPI = async ({
  ideaId,
  commentData,
}: {
  ideaId: string;
  commentData: IdeaCommentCreateData;
}): Promise<IdeaComment> => {
  const response = await fetch(`/api/ideas/${ideaId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commentData),
  });
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Failed to submit comment" }));
    throw new Error(errorData.error || "Failed to submit comment");
  }
  return response.json();
};

export function useSubmitIdeaComment(ideaId: string) {
  const queryClient = useQueryClient();

  return useMutation<IdeaComment, Error, IdeaCommentCreateData, unknown>({
    mutationFn: (commentData) => submitIdeaCommentAPI({ ideaId, commentData }),
    onSuccess: (newComment) => {
      toastSuccess("Comment posted successfully!");
      // Invalidate and refetch comments for this idea to show the new one
      // Or, for optimistic updates, add the new comment to the cache directly
      queryClient.invalidateQueries({ queryKey: ["ideaComments", ideaId] });

      // --- OPTIONAL: Optimistic Update Example ---
      // queryClient.setQueryData<InfiniteData<PaginatedIdeaComments>>(['ideaComments', ideaId], (oldData) => {
      //   if (!oldData) return oldData;
      //   const firstPage = oldData.pages[0];
      //   const newFirstPage = {
      //     ...firstPage,
      //     data: [newComment, ...firstPage.data], // Add to the top
      //     pagination: {
      //       ...firstPage.pagination,
      //       totalItems: firstPage.pagination.totalItems + 1,
      //     }
      //   };
      //   return {
      //     ...oldData,
      //     pages: [newFirstPage, ...oldData.pages.slice(1)],
      //   };
      // });
    },
    onError: (error) => {
      toastError(error.message || "Could not post comment.");
    },
  });
}

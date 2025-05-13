// hooks/ideas/useIdeaComments.ts
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { IdeaCommentCreateData } from "@/lib/schemas";
import { toastSuccess, toastError } from "@/utils/toast";
import { IdeaCommentPayload } from "@/types/serviceTypes"; // Use correct type

// Base URL for server-side fetching
const BASE_URL =
  process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

// --- Type Definitions ---
export type IdeaComment = IdeaCommentPayload; // Alias

export interface PaginatedIdeaComments {
  data: IdeaComment[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

// --- API Fetching Function (Absolute URL) ---
export const fetchIdeaCommentsAPI = async ({
  ideaId,
  pageParam = 1,
  limit = 10,
}: {
  ideaId: string;
  pageParam?: number;
  limit?: number;
}): Promise<PaginatedIdeaComments> => {
  const url = new URL(`${BASE_URL}/api/ideas/${ideaId}/comments`);
  url.searchParams.set("page", String(pageParam));
  url.searchParams.set("limit", String(limit));
  const response = await fetch(url.toString());
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({
        error: `Failed to fetch comments (${response.status})`,
      }));
    throw new Error(
      errorData.error || `Failed to fetch comments (${response.status})`
    );
  }
  return response.json(); // Expect { data: [], pagination: {} }
};

// --- React Query Hooks ---
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
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    enabled: !!ideaId,
  });
}

// --- Mutation Hook ---
const submitIdeaCommentAPI = async ({
  ideaId,
  commentData,
}: {
  ideaId: string;
  commentData: IdeaCommentCreateData;
}): Promise<IdeaComment> => {
  const response = await fetch(`/api/ideas/${ideaId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(commentData),
  });
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: `Post comment failed (${response.status})` }));
    throw new Error(
      errorData.error || `Post comment failed (${response.status})`
    );
  }
  return response.json(); // API returns the new IdeaCommentPayload
};

type SubmitIdeaCommentVariables = {
  // ideaId is already known in the hook's scope,
  // so the variable passed via mutate() only needs to be the comment data itself.
  // Let's rethink the mutationFn structure.
  commentData: IdeaCommentCreateData;
}

export function useSubmitIdeaComment(ideaId: string) {
  const queryClient = useQueryClient();
  return useMutation<IdeaComment, Error, IdeaCommentCreateData>({
    mutationFn: (commentDataVariable) => {
      // Call the API function, passing both the ideaId (from hook scope)
      // and the commentDataVariable (from mutate call)
      return submitIdeaCommentAPI({ ideaId: ideaId, commentData: commentDataVariable });
  },
    onSuccess: (newComment) => {
      toastSuccess("Comment posted!");
      // Invalidate comments query to refetch
      queryClient.invalidateQueries({ queryKey: ["ideaComments", ideaId] });
      // Also invalidate the single idea query to update comment count
      queryClient.invalidateQueries({ queryKey: ["idea", ideaId] });
    },
    onError: (error) => {
      toastError(error.message || "Could not post comment.");
    },
  });
}

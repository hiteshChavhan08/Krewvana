// hooks/ideas/useIdeas.ts
import {
  useQuery,
  useInfiniteQuery,
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { IdeaUpdateAPIData, IdeaCreateAPIData } from "@/lib/schemas"; // Use API specific schemas
import { toastSuccess, toastError } from "@/utils/toast";
import { IdeaWithCountsAndVoteStatus } from "@/types/serviceTypes"; // Use type from serviceTypes

// Base URL for server-side fetching - IMPORTANT: Needs env var set!
const BASE_URL =
  process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

// --- Type Definitions ---
export type Idea = IdeaWithCountsAndVoteStatus; // Alias
export type IdeaDetail = IdeaWithCountsAndVoteStatus; // Alias

export interface PaginatedIdeas {
  data: Idea[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

// --- API Fetching Functions (Absolute URLs) ---
export const fetchIdeasAPI = async ({
  pageParam = 1,
  limit = 9,
  sortBy = "createdAt",
  order = "desc",
}: {
  pageParam?: number;
  limit?: number;
  sortBy?: string;
  order?: string;
}): Promise<PaginatedIdeas> => {
  const url = new URL(`${BASE_URL}/api/ideas`);
  url.searchParams.set("page", String(pageParam));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("sortBy", sortBy);
  url.searchParams.set("order", order);
  const response = await fetch(url.toString());
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: `Failed to fetch ideas (${response.status})` }));
    throw new Error(
      errorData.error || `Failed to fetch ideas (${response.status})`
    );
  }
  return response.json();
};

export const fetchIdeaByIdAPI = async (ideaId: string): Promise<IdeaDetail> => {
  const url = `${BASE_URL}/api/ideas/${ideaId}`;
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) throw new Error("Idea not found");
    const errorData = await response
      .json()
      .catch(() => ({
        error: `Failed to fetch idea ${ideaId} (${response.status})`,
      }));
    throw new Error(
      errorData.error || `Failed to fetch idea ${ideaId} (${response.status})`
    );
  }
  const data = await response.json();
  if (!data) {
    // Handle case where API might return 200 OK with empty body for "not found"
    throw new Error("Idea not found");
  }
  return data;
};

// --- React Query Hooks ---
export function useIdeas({
  sortBy = "createdAt",
  order = "desc",
  limit = 9,
}: {
  sortBy?: string;
  order?: string;
  limit?: number;
}) {
  return useInfiniteQuery<
    PaginatedIdeas,
    Error,
    InfiniteData<PaginatedIdeas, number>,
    readonly [string, string, string],
    number
  >({
    queryKey: ["ideas", sortBy, order] as const,
    queryFn: ({ pageParam }) =>
      fetchIdeasAPI({ pageParam, sortBy, order, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });
}

export function useIdea(ideaId: string) {
  return useQuery<IdeaDetail, Error, IdeaDetail, readonly [string, string]>({
    queryKey: ["idea", ideaId] as const,
    queryFn: () => fetchIdeaByIdAPI(ideaId),
    enabled: !!ideaId,
    staleTime: 10 * 1000,
  });
}

// --- Mutation Hooks ---
const updateIdeaAPI = async ({
  ideaId,
  data,
}: {
  ideaId: string;
  data: IdeaUpdateAPIData;
}): Promise<IdeaDetail> => {
  const response = await fetch(`/api/ideas/${ideaId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: `Update failed (${response.status})` }));
    throw new Error(errorData.error || `Update failed (${response.status})`);
  }
  return response.json(); // API returns the updated IdeaDetail
};

export function useUpdateIdea() {
  const queryClient = useQueryClient();
  return useMutation<
    IdeaDetail,
    Error,
    { ideaId: string; data: IdeaUpdateAPIData }
  >({
    mutationFn: updateIdeaAPI,
    onSuccess: (updatedIdeaData, variables) => {
      toastSuccess("Idea updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["idea", variables.ideaId] });
      // Optionally invalidate list queries or optimistically update
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
    onError: (error) => {
      toastError(error.message || "Could not update idea.");
    },
  });
}

const deleteIdeaAPI = async (ideaId: string): Promise<{ message: string }> => {
  const response = await fetch(`/api/ideas/${ideaId}`, { method: "DELETE" });
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: `Delete failed (${response.status})` }));
    throw new Error(errorData.error || `Delete failed (${response.status})`);
  }
  return response.json();
};

export function useDeleteIdea() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: deleteIdeaAPI,
    onSuccess: (data, ideaId) => {
      toastSuccess(data.message || "Idea deleted successfully!");
      queryClient.removeQueries({ queryKey: ["idea", ideaId] });
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
    onError: (error) => {
      toastError(error.message || "Could not delete idea.");
    },
  });
}

// Define vote result type based on VoteOnIdeaServiceResponse data
type VoteResultData = {
  message: string;
  ideaId: string;
  voteCount: number;
  currentUserVoted: boolean;
};
const voteIdeaAPI = async (ideaId: string): Promise<VoteResultData> => {
  const response = await fetch(`/api/ideas/${ideaId}/vote`, { method: "POST" });
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: `Vote failed (${response.status})` }));
    throw new Error(errorData.error || `Vote failed (${response.status})`);
  }
  return response.json();
};
export function useVoteIdea() {
  const queryClient = useQueryClient();
  return useMutation<VoteResultData, Error, string>({
    mutationFn: voteIdeaAPI,
    onSuccess: (data, ideaId) => {
      // Optimistically update the specific idea query
      queryClient.setQueryData<IdeaDetail>(["idea", ideaId], (oldData) => {
        if (!oldData) return undefined;
        return {
          ...oldData,
          voteCount: data.voteCount,
          currentUserVoted: data.currentUserVoted,
        };
      });
      // Optionally invalidate lists or update them optimistically too
      queryClient.invalidateQueries({ queryKey: ["ideas"] }); // Invalidate lists
    },
    onError: (error) => {
      toastError(error.message || "Could not vote.");
    },
  });
}

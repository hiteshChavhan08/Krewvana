// app/app/ideas/[ideaId]/page.tsx
import React from "react";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
  InfiniteData, // Import InfiniteData
} from "@tanstack/react-query";
import { fetchIdeaByIdAPI, IdeaDetail } from "@/hooks/ideas/useIdeas"; // Correct import
import { IdeaDetailPageClient } from "./IdeaDetailPageClient";
import {
  fetchIdeaCommentsAPI,
  PaginatedIdeaComments,
} from "@/hooks/ideas/useIdeaComments";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface IdeaPageProps {
  params: {
    ideaId: string;
  };
}

export async function generateMetadata({
  params,
}: IdeaPageProps): Promise<Metadata> {
  const queryClient = new QueryClient();
  try {
    // Ensure type arguments match useQuery in useIdea hook
    const idea = await queryClient.fetchQuery<
      IdeaDetail,
      Error,
      IdeaDetail,
      readonly [string, string]
    >({
      queryKey: ["idea", params.ideaId] as const,
      queryFn: () => fetchIdeaByIdAPI(params.ideaId),
    });
    // No need to check !idea here as fetchQuery throws on error
    return {
      title: `${idea.title} | Kanaka Idea Wall`,
      description: idea.description.substring(0, 150) + "...",
    };
  } catch (error) {
    // If fetchQuery fails (e.g. idea not found from API, or network error)
    return { title: "Idea Not Found" }; // Or a more generic error title
  }
}

export default async function IdeaPage({ params }: IdeaPageProps) {
  const { ideaId } = params;
  const queryClient = new QueryClient();

  try {
    await queryClient.prefetchQuery<
      IdeaDetail,
      Error,
      IdeaDetail,
      readonly [string, string]
    >({
      // Match useIdea types
      queryKey: ["idea", ideaId] as const,
      queryFn: () => fetchIdeaByIdAPI(ideaId),
    });

    // Corrected type arguments for prefetchInfiniteQuery
    await queryClient.prefetchInfiniteQuery<
      PaginatedIdeaComments,
      Error,
      InfiniteData<PaginatedIdeaComments, number>, // TData
      readonly [string, string], // TQueryKey
      number // TPageParam
    >({
      queryKey: ["ideaComments", ideaId] as const,
      queryFn: ({ pageParam = 1 }) =>
        fetchIdeaCommentsAPI({ ideaId, pageParam, limit: 10 }),
      initialPageParam: 1,
      getNextPageParam: (lastPage: PaginatedIdeaComments) => {
        // Explicitly type lastPage
        if (lastPage.pagination.page < lastPage.pagination.totalPages) {
          return lastPage.pagination.page + 1;
        }
        return undefined;
      },
      // You might want to specify the number of pages to prefetch, e.g., pages: 1
      // pages: 1, // TanStack Query v5: `pages` option renamed to `initialPages` if you need more than 1 page.
      // For just the first page, initialPageParam is enough.
    });
  } catch (error) {
    console.error(
      `[IdeaPage] Error prefetching data for idea ${ideaId}:`,
      error
    );
    // Check if the idea itself failed to load, then call notFound()
    // getQueryState returns undefined if query is not found or has no data
    const ideaState = queryClient.getQueryState(["idea", ideaId] as const);
    if (ideaState?.status === "error" || !ideaState?.data) {
      console.warn(
        `[IdeaPage] Critical error fetching idea ${ideaId}, rendering 404.`
      );
      notFound();
    }
    // If only comments prefetch failed, the page can still render and client can fetch comments
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <IdeaDetailPageClient ideaId={ideaId} />
    </HydrationBoundary>
  );
}

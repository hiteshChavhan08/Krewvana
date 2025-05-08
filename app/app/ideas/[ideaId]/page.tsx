// app/app/ideas/[ideaId]/page.tsx
import React from "react";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
  InfiniteData,
} from "@tanstack/react-query";
import { fetchIdeaByIdAPI, IdeaDetail } from "@/hooks/ideas/useIdeas";
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
  const { ideaId } = params; // Destructure ideaId
  const queryClient = new QueryClient();

  try {
    const idea = await queryClient.fetchQuery<
      IdeaDetail,
      Error,
      IdeaDetail,
      readonly [string, string]
    >({
      queryKey: ["idea", ideaId] as const,
      queryFn: () => fetchIdeaByIdAPI(ideaId),
    });
    if (!idea) {
      // Should not happen if fetchIdeaByIdAPI throws on not found
      console.warn(
        `[generateMetadata] Idea not found for ID: ${ideaId} from fetchQuery. Triggering notFound.`
      );
      notFound();
    }
    return {
      title: `${idea.title} | Kanaka Idea Wall`,
      description: idea.description.substring(0, 150) + "...",
    };
  } catch (error) {
    console.error(
      `[generateMetadata] Error fetching idea ${ideaId} for metadata:`,
      error
    );
    notFound(); // Trigger 404 on any error during metadata generation for this idea
  }
}

export default async function IdeaPage({ params }: IdeaPageProps) {
  const { ideaId } = params; // Destructure ideaId
  const queryClient = new QueryClient();
  let ideaSuccessfullyPrefetched = false;

  try {
    await queryClient.prefetchQuery<
      IdeaDetail,
      Error,
      IdeaDetail,
      readonly [string, string]
    >({
      queryKey: ["idea", ideaId] as const,
      queryFn: () => fetchIdeaByIdAPI(ideaId),
    });
    // If prefetchQuery completes without throwing, we assume the idea data is now in the cache.
    // A more robust check would be to see if queryClient.getQueryData(['idea', ideaId]) is now populated.
    if (queryClient.getQueryData(["idea", ideaId] as const)) {
      ideaSuccessfullyPrefetched = true;
    } else {
      // This case might occur if prefetchQuery somehow completes but doesn't populate data,
      // or if fetchIdeaByIdAPI returns null/undefined without throwing an error that prefetchQuery catches.
      console.warn(
        `[IdeaPage] Prefetch for idea ${ideaId} completed but data not found in cache.`
      );
      // We will fall through to the final check before rendering.
    }

    // Prefetch comments regardless, but the page might 404 if idea isn't found later
    await queryClient.prefetchInfiniteQuery<
      PaginatedIdeaComments,
      Error,
      InfiniteData<PaginatedIdeaComments, number>,
      readonly [string, string],
      number
    >({
      queryKey: ["ideaComments", ideaId] as const,
      queryFn: ({ pageParam = 1 }) =>
        fetchIdeaCommentsAPI({ ideaId, pageParam, limit: 10 }),
      initialPageParam: 1,
      getNextPageParam: (lastPage: PaginatedIdeaComments) => {
        if (lastPage.pagination.page < lastPage.pagination.totalPages)
          return lastPage.pagination.page + 1;
        return undefined;
      },
    });
  } catch (error) {
    // This catch block will primarily catch errors from prefetchQuery for the idea if fetchIdeaByIdAPI throws.
    console.error(
      `[IdeaPage] Error during prefetching for idea ${ideaId}:`,
      error
    );
    // No need to call notFound() here directly, the check after the try-catch will handle it.
    // We set ideaSuccessfullyPrefetched to false (its initial state).
  }

  // Final check: Ensure the idea data is actually available before rendering.
  // This covers cases where prefetchQuery might have failed or didn't populate.
  if (
    !ideaSuccessfullyPrefetched &&
    !queryClient.getQueryData(["idea", ideaId] as const)
  ) {
    console.warn(
      `[IdeaPage] Critical: Idea data for ${ideaId} not available after prefetch attempts. Triggering notFound.`
    );
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <IdeaDetailPageClient ideaId={ideaId} />
    </HydrationBoundary>
  );
}

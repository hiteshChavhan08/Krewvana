// components/ideas/IdeaCommentList.tsx
"use client";
import React from "react";
import { IdeaCommentItem } from "./IdeaCommentItem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, MessageSquareOff, Info } from "lucide-react";
import {
  useIdeaComments,
  IdeaComment,
  PaginatedIdeaComments,
} from "@/hooks/ideas/useIdeaComments";

interface IdeaCommentListProps {
  ideaId: string;
}

export function IdeaCommentList({ ideaId }: IdeaCommentListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
  } = useIdeaComments(ideaId);

  const allComments: IdeaComment[] =
    data?.pages.flatMap((page: PaginatedIdeaComments) => page.data) || [];
  const totalItems = data?.pages[0]?.pagination.totalItems ?? 0;

  if (isLoading && !allComments.length) {
    return (
      <div className="space-y-4 mt-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex space-x-3 py-3">
            <Skeleton className="h-9 w-9 rounded-full mt-1" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="my-4">
        <Info className="h-4 w-4" />
        <AlertTitle>Error Loading Comments</AlertTitle>
        <AlertDescription>
          {error?.message || "An unknown error occurred."}
        </AlertDescription>
      </Alert>
    );
  }

  if (!isLoading && allComments.length === 0 && !hasNextPage) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <MessageSquareOff className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p className="font-semibold">No comments yet.</p>
        <p className="text-sm">Be the first to share your thoughts!</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-2">
      <h3 className="text-lg font-semibold mb-3">Comments ({totalItems})</h3>
      {allComments.map((comment) => (
        <IdeaCommentItem key={comment.id} comment={comment} />
      ))}
      {hasNextPage && (
        <div className="text-center pt-4">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            variant="outline"
            size="sm"
          >
            {isFetchingNextPage ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isFetchingNextPage ? "Loading More..." : "Load More Comments"}
          </Button>
        </div>
      )}
    </div>
  );
}

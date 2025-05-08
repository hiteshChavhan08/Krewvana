// components/ideas/IdeaCommentItem.tsx
"use client";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { IdeaComment } from "@/hooks/ideas/useIdeaComments";
// import { Card, CardContent } from "@/components/ui/card"; // Optional

interface IdeaCommentItemProps {
  comment: IdeaComment;
}

const getInitialsCommentAuthor = (name?: string | null) => {
  // Renamed to avoid conflict
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

export function IdeaCommentItem({ comment }: IdeaCommentItemProps) {
  return (
    <div className="flex space-x-3 py-3 border-b border-border last:border-b-0">
      <Avatar className="h-9 w-9 mt-1">
        <AvatarImage
          src={comment.author.image || undefined}
          alt={comment.author.name || "User"}
        />
        <AvatarFallback>
          {getInitialsCommentAuthor(comment.author.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">
            {comment.author.name || "Anonymous User"}
          </h4>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
        <p className="text-sm text-foreground whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>
    </div>
  );
}

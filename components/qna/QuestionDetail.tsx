// components\qna\QuestionDetail.tsx
import React from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import {
  ThumbsUp,
  MessageSquare,
  UserIcon,
  Eye,
  TagIcon,
  Share2,
  Bookmark,
} from "lucide-react"; // Added Share2, Bookmark

// Plate imports
import { Plate } from "@udecode/plate/react";
import { type Value } from "@udecode/plate";
import { useCreateEditor } from "@/components/editor/use-create-editor";
import { Editor } from "@/components/plate-ui/editor";

// UI components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Added Tooltip

// Types and hooks
import type { DetailedQuestion } from "@/lib/qna"; // Ensure this type includes nested author/answers/tags/votes
import { useVoteMutation } from "@/hooks/useVoteMutation"; // Assuming you have this hook

interface QuestionDetailProps {
  question: DetailedQuestion;
  // Add currentUserId if needed for vote/bookmark status checks
  // currentUserId?: string | null;
}

export const QuestionDetail: React.FC<QuestionDetailProps> = ({ question }) => {
  // Ensure content is valid Plate Value
  const initialContentValue = (
    Array.isArray(question.content) && question.content.length > 0
      ? question.content
      : [{ type: "p", children: [{ text: "" }] }]
  ) as Value;

  // Create editor instance
  const editor = useCreateEditor({
    id: `q-viewer-${question.id}`,
    readOnly: true,
    value: initialContentValue,
  });

  // Voting hook
  const { mutate: voteQuestion, isPending: isVoting } = useVoteMutation(
    "question",
    question.id
  );

  const handleVote = () => {
    // Add check: if (!currentUserId) { toast.error("Login required"); return; }
    voteQuestion({ voteType: "UPVOTE" });
  };

  const userHasVoted = !!question.userVote; // Check if the current user has voted
  const userHasBookmarked = false; // Placeholder: check if user bookmarked

  // Placeholder share action
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    // Use toast("Link copied!");
    console.log("Share action triggered");
  };

  // Placeholder bookmark action
  const handleBookmark = () => {
    // Add check: if (!currentUserId) { toast.error("Login required"); return; }
    // Call bookmark mutation here
    console.log("Bookmark action triggered");
  };

  return (
    <TooltipProvider>
      {" "}
      {/* Needed for Tooltip components */}
      <div className="bg-card rounded-lg border shadow-sm p-6">
        {/* Question Header */}
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold break-words leading-tight">
            {question.title}
          </h1>

          {/* Question Meta Info */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              <span>{question?.viewCount ?? 0} views</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              <span>{question.answers?.length ?? 0} answers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>
                Asked{" "}
                {formatDistanceToNow(new Date(question.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>

          {/* Tags */}
          {question.tags && question.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {question.tags.map(
                (
                  { tag } // Assuming tags are nested { tag: { id, name } }
                ) => (
                  <Link
                    key={tag.id}
                    href={`/app/qna?tag=${encodeURIComponent(tag.name)}`}
                    className="inline-block"
                  >
                    <Badge
                      variant="secondary"
                      className="px-2.5 py-0.5 cursor-pointer hover:bg-primary/20 transition-colors"
                    >
                      <TagIcon className="h-3 w-3 mr-1.5" />
                      {tag.name}
                    </Badge>
                  </Link>
                )
              )}
            </div>
          )}

          <Separator />
        </div>

        {/* Question Content */}
        <div className="my-6">
          <Plate editor={editor} readOnly>
            <div className="prose dark:prose-invert max-w-none">
              <Editor variant="ai" readOnly />
            </div>
          </Plate>
        </div>

        {/* Question Footer */}
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant={userHasVoted ? "default" : "outline"}
              size="sm"
              onClick={handleVote}
              disabled={isVoting /* || !currentUserId */}
              aria-pressed={userHasVoted}
              className="flex items-center gap-2 transition-all duration-200"
            >
              <ThumbsUp
                className={`h-4 w-4 ${
                  userHasVoted ? "fill-primary-foreground" : ""
                }`}
              />
              <span>
                Upvote {question.voteCount ? `(${question.voteCount})` : ""}
              </span>
            </Button>

            {/* Placeholder Share Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share Link</p>
              </TooltipContent>
            </Tooltip>

            {/* Placeholder Bookmark Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleBookmark}
                  // disabled={!currentUserId /* || isBookmarking */}
                >
                  <Bookmark
                    className={`h-4 w-4 ${
                      userHasBookmarked ? "fill-yellow-400 text-yellow-500" : ""
                    }`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{userHasBookmarked ? "Remove Bookmark" : "Bookmark"}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Author Card */}
          <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3 text-sm">
            <div className="text-muted-foreground text-xs">Asked by</div>
            <Avatar className="h-8 w-8 border">
              <AvatarImage
                src={question.author?.image || undefined}
                alt={question.author?.name || "User"}
              />
              <AvatarFallback>
                {question.author?.name?.charAt(0)?.toUpperCase() || (
                  <UserIcon size={16} />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <Link
                href={`/app/profile/${question.author?.id}`}
                className="font-medium hover:text-primary hover:underline transition-colors"
              >
                {question.author?.name || "Anonymous User"}
              </Link>
              {/* <span className="text-xs text-muted-foreground">
                {question.author?.reputation ? `${question.author.reputation} reputation` : ""}
              </span> */}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

// --- Skeleton Component (Unchanged) ---
export const QuestionDetailSkeleton = () => (
  <div className="bg-card rounded-lg border shadow-sm p-6 animate-pulse">
    <div className="h-8 bg-muted rounded-md w-3/4 mb-4"></div>
    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
      <div className="h-5 bg-muted rounded-md w-20"></div>
      <div className="h-5 bg-muted rounded-md w-24"></div>
      <div className="h-5 bg-muted rounded-md w-28"></div>
    </div>
    <div className="flex gap-2 mb-6">
      <div className="h-6 bg-muted rounded-md w-16"></div>
      <div className="h-6 bg-muted rounded-md w-20"></div>
    </div>
    <Separator className="my-4 bg-muted h-[1px]" />
    <div className="space-y-3 mb-6">
      <div className="h-4 bg-muted rounded-md w-full"></div>
      <div className="h-4 bg-muted rounded-md w-full"></div>
      <div className="h-4 bg-muted rounded-md w-3/4"></div>
    </div>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-8 gap-4">
      <div className="flex gap-2">
        <div className="h-9 bg-muted rounded-md w-24"></div>
        <div className="h-9 w-9 bg-muted rounded-md"></div>
        <div className="h-9 w-9 bg-muted rounded-md"></div>
      </div>
      <div className="h-12 bg-muted rounded-md w-48"></div>
    </div>
  </div>
);

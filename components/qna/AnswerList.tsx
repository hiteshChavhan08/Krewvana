// components\qna\AnswerList.tsx
import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Check, ThumbsUp, UserIcon, MessageSquare } from "lucide-react";
import { toast } from "sonner";

// UI components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Aceternity UI (Optional)
import { BackgroundGradient } from "@/components/ui/background-gradient"; // Assuming path

// Plate imports
import { Plate } from "@udecode/plate/react";
import { type Value } from "@udecode/plate";
import { useCreateEditor } from "@/components/editor/use-create-editor";
import { Editor } from "@/components/plate-ui/editor";

// Types and hooks (Keep your actual imports)
import type { DetailedQuestion } from "@/lib/qna";
import { useVoteMutation } from "@/hooks/useVoteMutation";
// import { useAcceptAnswerMutation } from "@/hooks/useAcceptAnswerMutation";
// import { useFetchComments } from "@/hooks/useFetchComments";
// import { usePostCommentMutation } from "@/hooks/usePostCommentMutation";

// --- Types ---
type Answer = DetailedQuestion["answers"][number] & {
  // Add potential missing fields if needed
  // voteCount?: number;
  // userVote?: { id: string; voteType: string; } | null;
  // _count?: { comments?: number }; // Example for comment count
};

interface AnswerListProps {
  questionId: string;
  answers: Answer[];
  questionAuthorId: string;
  currentUserId?: string | null;
}

// --- Single Answer Component ---
const AnswerItem: React.FC<{
  answer: Answer;
  currentUserId?: string | null;
  questionAuthorId: string;
  questionId: string;
}> = ({ answer, currentUserId, questionAuthorId, questionId }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  // --- Editor Setup ---
  const contentValue = (
    Array.isArray(answer.content) && answer.content.length > 0
      ? answer.content
      : [{ type: "p", children: [{ text: "" }] }]
  ) as Value;

  const editor = useCreateEditor({
    id: `ans-viewer-${answer.id}`,
    readOnly: true,
    value: contentValue,
  });

  const isAccepted = !!answer.isAccepted;

  // --- Mutations & Data Fetching (Placeholders - Use your actual hooks) ---
  const { mutate: voteAnswer, isPending: isVoting } = useVoteMutation(
    "answer",
    answer.id
  );
  // const { mutate: acceptAnswer, isPending: isAccepting } = useAcceptAnswerMutation();
  const isAccepting = false; // Placeholder
  // const { data: comments, isLoading: isLoadingComments } = useFetchComments(answer.id, { enabled: showComments });
  const comments: any[] = []; // Placeholder
  const isLoadingComments = false; // Placeholder
  // const { mutate: postComment, isPending: isPostingComment } = usePostCommentMutation();
  const isPostingComment = false; // Placeholder

  const userHasVoted = !!answer.userVote;

  // --- Handlers ---
  const handleVote = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      toast.error("Please sign in to vote.");
      return;
    }
    voteAnswer({ voteType: "UPVOTE" });
  };

  const handleAcceptAnswer = () => {
    if (!currentUserId || currentUserId !== questionAuthorId) return;
    console.log("Trigger accept answer mutation for:", answer.id);
    toast.info("Accept action triggered (implement mutation).");
    // acceptAnswer({ answerId: answer.id, questionId });
  };

  const handleToggleComments = () => setShowComments(!showComments);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUserId) {
      if (!currentUserId) toast.error("Please sign in to comment.");
      else toast.error("Comment cannot be empty.");
      return;
    }
    console.log("Trigger post comment mutation:", {
      answerId: answer.id,
      content: commentText,
    });
    toast.info("Post comment action triggered (implement mutation).");
    // postComment({ answerId: answer.id, content: commentText }, { onSuccess: () => setCommentText('') });
    setCommentText("");
  };

  // --- Helper function for short time format ---
  const formatShortTime = (date: Date): string => {
    const str = formatDistanceToNow(date, { addSuffix: true });
    return str
      .replace("about ", "")
      .replace("less than a minute ago", "<1m")
      .replace(" minutes", "m")
      .replace(" minute", "m")
      .replace(" hours", "h")
      .replace(" hour", "h")
      .replace(" days", "d")
      .replace(" day", "d")
      .replace(" ago", "");
  };

  // --- Render Logic ---
  const AnswerCardContent = (
    // Card container - ensure no extra padding/margin here affects footer visually
    <Card
      className={cn(
        "mb-6 transition-shadow duration-300 ease-in-out", // Use transition-shadow
        !isAccepted && "hover:shadow-md",
        "bg-card border border-border" // Explicit border
      )}
    >
      {/* Main Content - Ensure margin-bottom is controlled if needed */}
      <CardContent className="p-4 md:p-6">
        {" "}
        {/* Standard padding here */}
        <Plate editor={editor} readOnly>
          <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
            <Editor variant="ai" readOnly />
          </div>
        </Plate>
      </CardContent>

      <Separator />

      {/* ================= FOOTER START ================= */}
      {/* Goal: Minimal height, single row ideally, wrap minimally */}
      <CardFooter
        className={cn(
          "flex flex-row flex-wrap items-center justify-between", // Core layout: row, wrap, space between main groups
          "gap-x-2 gap-y-1", // Minimal gaps between elements/wrapped rows
          "p-1.5", // Minimal padding (6px)
          "min-h-[28px]" // Explicit minimum height (h-7 = 28px)
        )}
      >
        {/* --- Left Group: Actions --- */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {" "}
          {/* Don't shrink actions initially */}
          {/* Vote Button */}
          <Button
            variant={userHasVoted ? "default" : "outline"}
            size="sm" // Base size, override below
            onClick={handleVote}
            disabled={isVoting || !currentUserId}
            aria-pressed={userHasVoted}
            // Explicit minimal styling
            className={cn(
              "flex items-center gap-0.5 h-6 px-1.5 text-xs leading-none", // h-6 (24px), tiny gap/padding/text
              "transition-all duration-200 border", // Ensure border exists for outline
              userHasVoted
                ? "border-primary/50 bg-primary text-primary-foreground"
                : "border-border"
            )}
          >
            <ThumbsUp className="h-3 w-3 flex-shrink-0" />
            <span>{answer.voteCount || 0}</span>
          </Button>
          {/* Accept Answer Button */}
          {currentUserId === questionAuthorId && !isAccepted && (
            <Button
              variant="outline"
              size="sm" // Base size
              disabled={isAccepting}
              onClick={handleAcceptAnswer}
              aria-label="Accept this answer"
              // Explicit minimal styling
              className={cn(
                "flex items-center gap-0.5 h-6 px-1 text-xs leading-none", // h-6, tiny gap/padding/text
                "border-dashed border-green-500/50 text-green-600 dark:text-green-500",
                "hover:border-solid hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-500"
              )}
            >
              <Check className="h-3 w-3 mr-0.5 flex-shrink-0" />
              <span>{isAccepting ? "..." : "Accept"}</span>
            </Button>
          )}
        </div>

        {/* --- Right Group: Meta Info --- */}
        {/* This group grows/shrinks and wraps internally if needed */}
        <div className="flex items-center flex-wrap justify-end gap-x-2 gap-y-0.5 text-xs leading-tight flex-grow min-w-0">
          {/* Accepted Badge (only if accepted) */}
          {isAccepted && (
            <Badge
              variant="outline"
              // Explicit minimal styling
              className="font-medium h-5 px-1 py-0 leading-none inline-flex items-center gap-0.5 text-xs border-green-500 text-green-600 dark:text-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20"
            >
              <Check className="h-3 w-3 flex-shrink-0" />
              Accepted
            </Badge>
          )}

          {/* Comments Trigger */}
          <Button
            variant="ghost"
            size="sm" // Base size
            onClick={handleToggleComments}
            // Explicit minimal styling
            className="flex items-center gap-0.5 h-6 px-1 text-xs leading-none text-muted-foreground hover:text-primary hover:bg-transparent" // Transparent bg on hover
          >
            <MessageSquare className="h-3 w-3 flex-shrink-0" />
            <span className="hidden sm:inline">Comments</span>{" "}
            {/* Hide text on xs */}
            {/* Optionally show count: <span>({answer._count?.comments ?? 0})</span> */}
          </Button>

          {/* Author Info */}
          {/* Using inline-flex for potentially tighter grouping */}
          <div className="inline-flex items-center gap-1 text-muted-foreground flex-shrink-0">
            <Avatar className="h-4 w-4 flex-shrink-0">
              {" "}
              {/* Min avatar */}
              <AvatarImage
                src={answer.author?.image || undefined}
                alt={answer.author?.name || "User"}
              />
              <AvatarFallback className="text-[9px] leading-none">
                {answer.author?.name?.charAt(0)?.toUpperCase() || (
                  <UserIcon size={8} />
                )}
              </AvatarFallback>
            </Avatar>
            {/* Combine Name (conditionally) + Time */}
            <span className="inline-block truncate max-w-[80px] sm:max-w-[120px]">
              {" "}
              {/* Truncate container */}
              <Link
                href={`/app/profile/${answer.author?.id}`}
                className="font-medium text-foreground/80 hover:underline hover:text-primary transition-colors hidden sm:inline" // Hide name link on xs
              >
                {answer.author?.name?.substring(0, 10) || "Anon"}{" "}
                {/* Short name */}
              </Link>
              <time
                dateTime={new Date(answer.createdAt).toISOString()}
                className="sm:ml-1 whitespace-nowrap text-muted-foreground/80 text-[11px]"
              >
                {" "}
                {/* Slightly smaller time text */}
                {formatShortTime(new Date(answer.createdAt))}
              </time>
            </span>
          </div>
        </div>
      </CardFooter>
      {/* ================= FOOTER END ================= */}

      {/* Conditionally Rendered Comments Section */}
      {showComments && (
        // Ensure this section has minimal top margin/padding if needed
        <div className="px-4 py-3 md:px-6 md:py-4 border-t border-border/60 bg-muted/20">
          <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
            Comments
          </h4>
          {isLoadingComments ? (
            <p className="text-xs text-muted-foreground italic">Loading...</p>
          ) : comments.length > 0 ? (
            <div className="space-y-2 mb-3 max-h-60 overflow-y-auto pr-1">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="text-xs flex gap-1.5 items-start"
                >
                  <Avatar className="h-5 w-5 mt-0.5 flex-shrink-0">
                    {/* <AvatarImage src={comment.author.image} /> */}
                    <AvatarFallback className="text-[10px]">
                      {comment.author?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="font-medium text-foreground mr-1">
                      {comment.author?.name || "Anon"}
                    </span>
                    <span className="text-foreground/90">
                      {comment.content}
                    </span>
                    {/* <span className="text-muted-foreground/70 ml-1.5 text-[10px]">({formatShortTime(new Date(comment.createdAt))})</span> */}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mb-3 italic">
              No comments yet.
            </p>
          )}

          {/* Add Comment Form */}
          {currentUserId && (
            <form
              onSubmit={handlePostComment}
              className="flex gap-2 items-start"
            >
              <Avatar className="h-6 w-6 mt-0.5 flex-shrink-0">
                {/* Current user avatar */}
                <AvatarFallback className="text-xs">
                  <UserIcon size={12} />
                </AvatarFallback>
              </Avatar>
              <Textarea
                placeholder="Add a comment..."
                rows={1} // Start with 1 row
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-grow text-xs min-h-[28px] resize-none" // Minimal height, no resize handle
              />
              <Button
                type="submit"
                size="sm"
                disabled={isPostingComment || !commentText.trim()}
                className="h-7 self-end"
              >
                {" "}
                {/* Align button */}
                {isPostingComment ? "..." : "Post"}
              </Button>
            </form>
          )}
        </div>
      )}
    </Card> // End of main AnswerItem Card
  );

  // Wrap with gradient only for accepted answers
  if (isAccepted) {
    return (
      <BackgroundGradient
        className="rounded-lg p-0.5 shadow-md shadow-green-500/10"
        containerClassName="rounded-lg"
        animate={true}
      >
        {AnswerCardContent}
      </BackgroundGradient>
    );
  }

  return AnswerCardContent;
};

// --- Main AnswerList Component ---
export const AnswerList: React.FC<AnswerListProps> = ({
  answers,
  questionId,
  questionAuthorId,
  currentUserId,
}) => {
  if (!answers || answers.length === 0) {
    // No changes needed here for footer height issue
    return (
      <div className="mt-8 border-t border-border pt-8">
        <div className="text-center py-10 bg-muted/30 rounded-lg border border-dashed">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">
            This question hasn't been answered yet.
          </p>
        </div>
      </div>
    );
  }

  // Sort answers (no changes needed)
  const sortedAnswers = [...answers].sort((a, b) => {
    if (a.isAccepted && !b.isAccepted) return -1;
    if (!a.isAccepted && b.isAccepted) return 1;
    const voteDiff = (b.voteCount ?? 0) - (a.voteCount ?? 0);
    if (voteDiff !== 0) return voteDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div className="mt-8 border-t border-border pt-8">
      <h2 className="text-xl sm:text-2xl font-semibold tracking-tight mb-6 flex items-center">
        <MessageSquare className="h-5 w-5 mr-2 text-muted-foreground" />
        {sortedAnswers.length} Answer{sortedAnswers.length !== 1 ? "s" : ""}
      </h2>
      {/* Reduced space between answers if desired */}
      <div className="space-y-4">
        {sortedAnswers.map((answer) => (
          <AnswerItem
            key={answer.id}
            answer={answer}
            currentUserId={currentUserId}
            questionAuthorId={questionAuthorId}
            questionId={questionId}
          />
        ))}
      </div>
    </div>
  );
};

// --- Skeleton Component (No changes needed) ---
export const AnswerListSkeleton = () => (
  <div className="mt-8 border-t border-border pt-8 animate-pulse">
    <div className="h-8 bg-muted rounded-md w-40 mb-6"></div>
    <div className="space-y-4">
      {" "}
      {/* Match reduced space-y */}
      {[1, 2].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded-md w-full"></div>
              <div className="h-4 bg-muted rounded-md w-full"></div>
              <div className="h-4 bg-muted rounded-md w-3/4"></div>
            </div>
          </CardContent>
          <Separator className="bg-muted h-[1px]" />
          <CardFooter className="p-1.5 min-h-[28px]">
            {" "}
            {/* Match footer padding/height */}
            <div className="flex justify-between w-full items-center">
              <div className="flex gap-1.5">
                <div className="h-6 w-12 bg-muted rounded-md"></div>
                {/* Optional: Skeleton for accept button */}
              </div>
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-muted rounded-md"></div>
                <div className="h-6 w-6 bg-muted rounded-md"></div>
                <div className="h-6 w-20 bg-muted rounded-md"></div>
              </div>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  </div>
);

// components\qna\AnswerList.tsx
import React, { useState } from "react"; // Added useState
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
import { Textarea } from "@/components/ui/textarea"; // Added Textarea
import { cn } from "@/lib/utils";

// Aceternity UI (Optional)
import { BackgroundGradient } from "@/components/ui/background-gradient"; // Assuming path

// Plate imports
import { Plate } from "@udecode/plate/react";
import { type Value } from "@udecode/plate";
import { useCreateEditor } from "@/components/editor/use-create-editor";
import { Editor } from "@/components/plate-ui/editor";

// Types and hooks
import type { DetailedQuestion } from "@/lib/qna"; // Ensure Answer type includes author, votes, userVote, isAccepted etc.
import { useVoteMutation } from "@/hooks/useVoteMutation"; // Assuming you have this
// import { useAcceptAnswerMutation } from "@/hooks/useAcceptAnswerMutation"; // Placeholder
// import { useFetchComments } from "@/hooks/useFetchComments"; // Placeholder
// import { usePostCommentMutation } from "@/hooks/usePostCommentMutation"; // Placeholder

// --- Types ---
// Extract Answer type from the detailed question type
type Answer = DetailedQuestion["answers"][number] & {
  // Explicitly add fields if not directly in Prisma type from question
  // e.g., voteCount?: number;
  // userVote?: { id: string; voteType: string; } | null;
};

interface AnswerListProps {
  questionId: string;
  answers: Answer[];
  questionAuthorId: string;
  currentUserId?: string | null; // ID of the currently logged-in user
}

// --- Single Answer Component (Defined within AnswerList file or imported) ---
const AnswerItem: React.FC<{
  answer: Answer;
  currentUserId?: string | null;
  questionAuthorId: string;
  questionId: string; // Pass questionId for context if needed by mutations
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

  // --- Voting ---
  const { mutate: voteAnswer, isPending: isVoting } = useVoteMutation(
    "answer",
    answer.id
  );
  const userHasVoted = !!answer.userVote;

  const handleVote = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      toast.error("Please sign in to vote.");
      return;
    }
    voteAnswer({ voteType: "UPVOTE" });
  };

  // --- Accepting Answer (Placeholder) ---
  // const { mutate: acceptAnswer, isPending: isAccepting } = useAcceptAnswerMutation(); // Placeholder hook
  const isAccepting = false; // Placeholder state
  const handleAcceptAnswer = () => {
    if (!currentUserId || currentUserId !== questionAuthorId) return;
    // acceptAnswer({ answerId: answer.id, questionId }); // Call mutation
    console.log("Trigger accept answer mutation for:", answer.id);
    toast.info("Accept answer action triggered (implement mutation).");
  };

  // --- Comments (Placeholders) ---
  // const { data: comments, isLoading: isLoadingComments } = useFetchComments(answer.id, { enabled: showComments }); // Fetch only when shown
  const comments: any[] = []; // Placeholder data
  const isLoadingComments = false; // Placeholder state
  // const { mutate: postComment, isPending: isPostingComment } = usePostCommentMutation(); // Placeholder hook
  const isPostingComment = false; // Placeholder state

  const handleToggleComments = () => setShowComments(!showComments);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUserId) {
      if (!currentUserId) toast.error("Please sign in to comment.");
      else toast.error("Comment cannot be empty.");
      return;
    }
    // postComment({ answerId: answer.id, content: commentText }); // Call mutation
    console.log("Trigger post comment mutation:", {
      answerId: answer.id,
      content: commentText,
    });
    toast.info("Post comment action triggered (implement mutation).");
    setCommentText(""); // Clear textarea optimistically or on success
  };

  // --- Render Logic ---
  const AnswerCardContent = (
    <Card
      className={cn(
        "mb-6 transition-all duration-300 ease-in-out",
        !isAccepted && "hover:shadow-md", // Only apply hover shadow if not accepted (gradient provides highlight)
        "bg-card" // Ensure background for non-accepted state
      )}
    >
      <CardContent className="p-6">
        {/* Answer Content */}
        <Plate editor={editor} readOnly>
          <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none mb-4">
            <Editor variant="ai" readOnly />
          </div>
        </Plate>
      </CardContent>

      <Separator />

      <CardFooter className="flex flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
        {/* Left Side: Actions (Vote, Accept) - Keep together, don't shrink initially */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Vote Button */}
          <Button
            variant={userHasVoted ? "default" : "outline"}
            size="sm" // Keep size 'sm' for reasonable click target
            onClick={handleVote}
            disabled={isVoting || !currentUserId}
            aria-pressed={userHasVoted}
            className={cn(
              "flex items-center gap-1.5 transition-all duration-200 h-8", // Reduced gap, set height
              userHasVoted ? "border-primary/50" : "border"
            )}
          >
            <ThumbsUp className="h-4 w-4" /> {/* Icon size is fine */}
            <span className="text-xs">{answer.voteCount || 0}</span>{" "}
            {/* Maybe smaller text */}
          </Button>

          {/* Accept Answer Button (Conditional) */}
          {currentUserId === questionAuthorId && !isAccepted && (
            <Button
              variant="outline"
              size="sm"
              disabled={isAccepting}
              onClick={handleAcceptAnswer}
              className="border-dashed border-green-500/50 text-green-600 dark:text-green-500 hover:border-solid hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-500 h-8 px-2" // Reduced padding, set height
              aria-label="Accept this answer"
            >
              <Check className="h-4 w-4 mr-1" /> {/* Reduced margin */}
              <span className="text-xs">
                {isAccepting ? "Accepting..." : "Accept"}
              </span>{" "}
              {/* Smaller text */}
            </Button>
          )}
        </div>

        {/* Right Side: Author Info, Accepted Badge, Comments Trigger - Allow wrapping and align right */}
        <div className="flex items-center flex-wrap justify-end gap-x-2 gap-y-1 text-xs flex-grow min-w-0">
          {" "}
          {/* Reduced gaps, text-xs base, allow grow/shrink */}
          {/* Accepted Badge */}
          {isAccepted && (
            <Badge
              variant="outline"
              className="border-green-500 text-green-600 dark:text-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20 font-medium px-2 py-0.5 h-6" // Reduced padding, set height
            >
              <Check className="h-3 w-3 mr-1" /> {/* Smaller icon/margin */}
              Accepted
            </Badge>
          )}
          {/* Comments Trigger */}
          <Button
            variant="ghost"
            size="sm" // Keep sm for tap area
            onClick={handleToggleComments}
            className="text-muted-foreground hover:text-primary px-1 h-7 flex items-center" // Adjust padding/height
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1" />{" "}
            {/* Smaller icon/margin */}
            <span className="text-xs">Comments</span>{" "}
            {/* Ensure text is small */}
          </Button>
          {/* Author Info */}
          <div className="flex items-center gap-1 text-muted-foreground flex-shrink min-w-0">
            {" "}
            {/* Reduced gap, allow shrink */}
            <Avatar className="h-5 w-5">
              {" "}
              {/* Small avatar */}
              <AvatarImage
                src={answer.author?.image || undefined}
                alt={answer.author?.name || "User"}
              />
              <AvatarFallback className="text-[10px]">
                {answer.author?.name?.charAt(0)?.toUpperCase() || (
                  <UserIcon size={10} />
                )}
              </AvatarFallback>
            </Avatar>
            <span className="flex items-center gap-x-1 flex-shrink min-w-0">
              {" "}
              {/* Allow shrink */}
              <Link
                href={`/app/profile/${answer.author?.id}`}
                className="font-medium text-foreground hover:underline hover:text-primary transition-colors truncate" // Add truncate
              >
                {answer.author?.name || "Anonymous User"}
              </Link>
              <span className="mx-1 hidden sm:inline">•</span>
              <time
                dateTime={new Date(answer.createdAt).toISOString()}
                className="whitespace-nowrap flex-shrink-0"
              >
                {" "}
                {/* Prevent time from shrinking */}
                {formatDistanceToNow(new Date(answer.createdAt), {
                  addSuffix: true,
                })}
              </time>
            </span>
          </div>
        </div>
      </CardFooter>

      {/* Conditionally Rendered Comments Section */}
      {showComments && (
        <div className="px-6 pb-4 pt-4 border-t border-border/60 bg-muted/20">
          {" "}
          {/* Slight bg tint */}
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
            Comments
          </h4>
          {isLoadingComments ? (
            <p className="text-xs text-muted-foreground italic">
              Loading comments...
            </p>
          ) : comments.length > 0 ? (
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
              {" "}
              {/* Scrollable comments */}
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="text-xs flex gap-2 items-start"
                >
                  <Avatar className="h-5 w-5 mt-0.5">
                    {/* <AvatarImage src={comment.author.image} /> */}
                    <AvatarFallback className="text-[10px]">
                      {comment.author?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="font-medium text-foreground mr-1.5">
                      {comment.author?.name || "Anon"}
                    </span>
                    <span>{comment.content}</span>
                    <span className="text-muted-foreground/80 ml-2">
                      {/* {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })} */}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mb-4 italic">
              No comments yet.
            </p>
          )}
          {/* Add Comment Form */}
          {currentUserId && ( // Only show form if logged in
            <form
              onSubmit={handlePostComment}
              className="flex gap-2 items-start"
            >
              <Avatar className="h-7 w-7 mt-1">
                {/* Add current user avatar here */}
                <AvatarFallback className="text-xs">
                  {/* {currentUser?.name?.charAt(0)?.toUpperCase() || <UserIcon size={12}/>} */}
                  <UserIcon size={12} />
                </AvatarFallback>
              </Avatar>
              <Textarea
                placeholder="Add a comment..."
                rows={2}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-grow text-sm min-h-[40px]" // Ensure small height
              />
              <Button
                type="submit"
                size="sm"
                disabled={isPostingComment || !commentText.trim()}
                className="self-end" // Align button with bottom of textarea
              >
                {isPostingComment ? "..." : "Post"}
              </Button>
            </form>
          )}
        </div>
      )}
    </Card>
  );

  // Wrap with gradient only for accepted answers
  if (isAccepted) {
    return (
      <BackgroundGradient
        className="rounded-lg p-0.5 shadow-md shadow-green-500/10" // Add subtle shadow effect
        containerClassName="rounded-lg"
        animate={true} // Keep animation subtle
        // Optional: Adjust gradient colors if needed for dark mode contrast
        // gradientClassName="from-green-500/20 via-green-300/20 to-emerald-500/20 dark:from-green-400/10 dark:via-green-300/10 dark:to-emerald-400/10"
      >
        {AnswerCardContent}
      </BackgroundGradient>
    );
  }

  return AnswerCardContent; // Return regular card if not accepted
};

// --- Main AnswerList Component ---
export const AnswerList: React.FC<AnswerListProps> = ({
  answers,
  questionId,
  questionAuthorId,
  currentUserId,
}) => {
  if (!answers || answers.length === 0) {
    return (
      <div className="mt-8 border-t border-border pt-8">
        <div className="text-center py-10 bg-muted/30 rounded-lg border border-dashed">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">
            This question hasn't been answered yet.
          </p>
          {/* Optional: Link/button to encourage answering */}
          {/* <Button variant="link" className="mt-2" onClick={() => document.getElementById('answer-form')?.scrollIntoView({ behavior: 'smooth' })}>
             Be the first one to answer!
          </Button> */}
        </div>
      </div>
    );
  }

  // Sort answers: Accepted first, then by vote count (desc), then by creation date (asc)
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
      <div className="space-y-6">
        {" "}
        {/* Add space between AnswerItems */}
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

// --- Skeleton Component (Unchanged) ---
export const AnswerListSkeleton = () => (
  <div className="mt-8 border-t border-border pt-8 animate-pulse">
    <div className="h-8 bg-muted rounded-md w-40 mb-6"></div>
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <Card key={i} className="mb-6 overflow-hidden">
          {" "}
          {/* Added overflow hidden */}
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded-md w-full"></div>
              <div className="h-4 bg-muted rounded-md w-full"></div>
              <div className="h-4 bg-muted rounded-md w-3/4"></div>
            </div>
          </CardContent>
          <Separator className="bg-muted h-[1px]" />
          <CardFooter className="p-4 flex justify-between items-center">
            <div className="flex gap-2">
              <div className="h-8 bg-muted rounded-md w-16"></div>
              <div className="h-8 bg-muted rounded-md w-20"></div>
            </div>
            <div className="h-8 bg-muted rounded-md w-48"></div>
          </CardFooter>
        </Card>
      ))}
    </div>
  </div>
);

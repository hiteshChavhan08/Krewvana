// components/qna/AnswerList.tsx
import React from "react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { Button } from "@/components/ui/button";
import { Check, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DetailedQuestion } from "@/lib/qna"; // Adjust path
type Answer = DetailedQuestion["answers"][number]; // Extract answer type

// --- Plate Imports (Mirror QuestionDetail) ---
import { Plate } from "@udecode/plate/react";
import { type Value } from "@udecode/plate";
import { usePlateEditor } from "@udecode/plate/react";
import { Editor } from "@/components/plate-ui/editor"; // YOUR Component
// Import ALL necessary rendering plugins (ensure this list matches QuestionDetail or contains everything needed for answers)
import { useCreateEditor } from "@/components/editor/use-create-editor"; // Adjust path

// --- Vote Hook ---
import { useVoteMutation } from "@/hooks/useVoteMutation"; // Adjust path
import { toast } from "sonner";

interface AnswerListProps {
  questionId: string;
  answers: Answer[];
  questionAuthorId: string;
  currentUserId?: string | null; // Pass current user ID for voting/accepting
  // onAcceptAnswer?: (answerId: string) => void; // Keep if needed
}

const AnswerItem: React.FC<{
  answer: Answer;
  currentUserId?: string | null;
  questionAuthorId: string /* onAcceptAnswer?: (id:string)=>void */;
}> = ({ answer, currentUserId, questionAuthorId /* onAcceptAnswer */ }) => {
  // --- Option B (Recommended): Use PlateProvider ---
  // Create a stable editor config instance ONCE outside the map in parent if possible,
  // Or define it here if needed specifically per item (less common for read-only)
  const contentValue = (
    Array.isArray(answer.content) ? answer.content : []
  ) as Value;
  // For simplicity here, we define plugins again, but ideally share the constant.
  const editor = useCreateEditor({
    id: `ans-viewer-${answer.id}`, // Unique ID per viewer
    readOnly: true,
    value: contentValue,
    // Value is set by PlateProvider below
  });

  const isAccepted = answer.isAccepted;
  // const canAccept = currentUserId === questionAuthorId && !isAccepted && !answers.some(a => a.isAccepted); // Use full answers list from props if needed

  // --- Voting Hook ---
  const { mutate: voteAnswer, isPending: isVoting } = useVoteMutation(
    "answer",
    answer.id
  );
  const userHasVoted = !!answer.userVote;

  const handleVote = () => {
    if (!currentUserId) {
      toast.error("Please sign in to vote.");
      return;
    }
    voteAnswer({ voteType: "UPVOTE" });
  };
  // --- End Voting Hook ---

  return (
    <div
      key={answer.id}
      className={`border-b pb-6 mb-6 ${
        isAccepted ? "border-l-4 border-green-500 pl-4 -ml-4" : ""
      }`}
    >
      {/* Plate Read-Only Viewer */}

      <Plate editor={editor} readOnly>
        <div className="prose dark:prose-invert max-w-none text-sm mb-3">
          <Editor variant="ai" readOnly />
        </div>
      </Plate>

      <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
        <span>
          Answered by{" "}
          <Link
            href={`/app/profile/${answer.author?.id}`}
            className="hover:underline text-primary"
          >
            {answer.author?.name || "User"}
          </Link>{" "}
          -{" "}
          {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
        </span>
        <div className="flex items-center gap-2">
          {/* Answer Vote Button */}
          <Button
            variant={userHasVoted ? "secondary" : "ghost"}
            size="sm"
            onClick={handleVote}
            disabled={isVoting || !currentUserId}
            aria-pressed={userHasVoted}
            className="flex items-center gap-1"
            title={userHasVoted ? "Remove upvote" : "Upvote answer"}
          >
            <ThumbsUp
              className={cn(
                "h-3.5 w-3.5",
                userHasVoted ? "text-primary fill-primary" : ""
              )}
            />
            <span>{answer.voteCount ?? 0}</span>
          </Button>

          {/* Accept Button/Badge Logic */}
          {/* {canAccept && onAcceptAnswer && ( <Button size="xs" variant="outline" onClick={() => onAcceptAnswer(answer.id)}><Check className="h-3.5 w-3.5 mr-1" /> Accept</Button> )} */}
          {isAccepted && (
            <span className="flex items-center text-green-600 font-medium text-xs bg-green-100 dark:bg-green-900/50 px-2 py-0.5 rounded-full">
              <Check className="h-3.5 w-3.5 mr-1" /> Accepted
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main AnswerList Component ---
export const AnswerList: React.FC<AnswerListProps> = ({
  answers,
  questionId,
  questionAuthorId,
  currentUserId /* onAcceptAnswer */,
}) => {
  if (!answers || answers.length === 0) {
    return (
      <p className="text-center text-muted-foreground mt-6 border-t pt-8">
        No answers yet.
      </p>
    );
  }

  return (
    <div className="space-y-0 border-t pt-8">
      {" "}
      {/* Reduced space-y, AnswerItem handles margin */}
      <h2 className="text-2xl font-semibold mb-6">
        {answers.length} Answer{answers.length !== 1 ? "s" : ""}
      </h2>
      {answers.map((answer) => (
        // Pass necessary props to the AnswerItem component
        <AnswerItem
          key={answer.id}
          answer={answer}
          currentUserId={currentUserId}
          questionAuthorId={questionAuthorId}
          // onAcceptAnswer={onAcceptAnswer}
        />
      ))}
    </div>
  );
};

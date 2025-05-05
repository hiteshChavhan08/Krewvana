// components/qna/QuestionDetail.tsx
import React from "react";
import type { DetailedQuestion } from "@/lib/qna"; // Adjust path

// --- Plate Core Imports ---
import { Plate } from "@udecode/plate/react"; // Correct core import
import { type Value } from "@udecode/plate"; // Correct type import
// 👇 Import YOUR custom editor hook
import { useCreateEditor } from "@/components/editor/use-create-editor"; // Adjust path
import { Editor } from "@/components/plate-ui/editor"; // YOUR Component
import { ThumbsUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoteMutation } from "@/hooks/useVoteMutation";

interface QuestionDetailProps {
  question: DetailedQuestion;
}

export const QuestionDetail: React.FC<QuestionDetailProps> = ({ question }) => {
  // Ensure content is valid Plate Value
  const initialContentValue = (
    Array.isArray(question.content) && question.content.length > 0
      ? question.content
      : [{ type: "p", children: [{ text: "" }] }]
  ) as Value;

  // --- Use YOUR custom hook ---
  const editor = useCreateEditor(
    {
      id: `q-viewer-${question.id}`, // Provide unique ID
      readOnly: true, // <-- Set readOnly to true
      //plugins: [], // <-- REMOVE: Let the hook use its internal viewPlugins
      value: initialContentValue, // <-- Pass initial value here
      // components: {}, // Pass custom components only if needed to override hook defaults
      // override: {},   // Pass overrides only if needed
    }
    // No dependencies needed here usually unless options object changes identity
  );
  // --- End hook usage ---
  const { mutate: voteQuestion, isPending: isVoting } = useVoteMutation(
    "question",
    question.id
  );

  const handleVote = () => {
    voteQuestion({ voteType: "UPVOTE" }); // Only upvote for now
  };

  const userHasVoted = !!question.userVote; // Check if userVote is not null

  return (
    <div className="border-b pb-6 mb-6">
      {/* ... Title, Meta Info ... */}
      <h1 className="text-2xl md:text-3xl font-bold mb-2 break-words">
        {question.title}
      </h1>
      {/* ... */}

      {/* Plate Read-Only Viewer */}
      <Plate
        editor={editor} // Pass the editor instance created by your hook
        // No value or initialValue needed here if set via hook options
        readOnly // Set readOnly prop on Plate component as well
      >
        <div className="prose dark:prose-invert max-w-none mt-4 text-sm">
          <Editor
            variant="ai" // Ghost usually best for read-only
            readOnly // Set readOnly on Editor too
            // focusable={false} // Optional: prevent focus
          />
        </div>
      </Plate>

      {/* ... Votes ... */}
      <div className="mt-4 text-right text-sm">
        {" "}
        Votes: {question.voteCount ?? 0}{" "}
      </div>
      {/* --- Actions Bar --- */}
      <div className="mt-4 flex items-center justify-between text-sm">
        {/* Vote Button */}
        <Button
          variant={userHasVoted ? "default" : "outline"} // Change variant if voted
          size="sm"
          onClick={handleVote}
          disabled={isVoting} // Disable if voting or not logged in
          aria-pressed={userHasVoted} // Accessibility
        >
          <ThumbsUp className={`h-4 w-4 mr-2 ${userHasVoted ? "" : ""}`} />
          {/* Maybe show "Upvoted" if userHasVoted? */}
          Upvote ({question.voteCount ?? 0})
        </Button>

        {/* Answer Count (Optional display here) */}
        <div className="text-muted-foreground flex items-center gap-1">
          <MessageSquare className="h-4 w-4" />
          <span>
            {question.answers?.length ?? 0} Answer
            {question.answers?.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
};

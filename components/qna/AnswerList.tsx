import React from "react";
// Import the Answer type from DetailedQuestion or Prisma
import type { DetailedQuestion } from "@/lib/qna"; // Adjust path
type Answer = DetailedQuestion["answers"][number]; // Extract answer type

interface AnswerListProps {
  questionId: string;
  answers: Answer[];
  questionAuthorId: string;
}

export const AnswerList: React.FC<AnswerListProps> = ({
  answers,
  questionId,
  questionAuthorId,
}) => {
  if (!answers || answers.length === 0) {
    return (
      <p className="text-center text-muted-foreground mt-6">No answers yet.</p>
    );
  }
  return (
    <div className="space-y-6 border-t pt-8">
      <h2 className="text-2xl font-semibold mb-4">
        {answers.length} Answer{answers.length !== 1 ? "s" : ""}
      </h2>
      {answers.map((answer) => (
        <div key={answer.id} className="border-b pb-4">
          {/* Render answer.content using Plate.js viewer */}
          <div className="prose dark:prose-invert max-w-none text-sm">
            {JSON.stringify(answer.content)}
          </div>{" "}
          {/* Placeholder */}
          <p className="text-xs text-muted-foreground mt-2">
            Answered by {answer.author?.name || "User"}{" "}
            {/* Add date/votes/accept button */}
          </p>
        </div>
      ))}
    </div>
  );
};

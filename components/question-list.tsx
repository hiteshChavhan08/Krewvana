// app/app/ama/[sessionId]/_components/question-list.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getInitials } from "@/lib/utils/helpers";
import { formatDistanceToNow } from "@/lib/utils/date-helpers";
import { MessageSquare, Check, Edit3, Trash2, Loader2 } from "lucide-react"; // Icons for questions/answers
import { Button } from "@/components/ui/button"; // For actions later
import { Textarea } from "@/components/ui/textarea"; // For answering later
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// --- Type Definition for Question Data ---
type QuestionData = {
  id: string;
  text: string;
  isAnonymous: boolean;
  isApproved: boolean;
  answerText: string | null;
  answeredAt: string | Date | null;
  createdAt: string | Date;
  submittedBy: { id: string; name: string | null; image: string | null } | null; // Null if anonymous
  answeredBy: { id: string; name: string | null; image: string | null } | null;
};

interface QuestionListProps {
  sessionId: string;
  isHostOrAdmin: boolean; // To enable moderation controls
}

// --- Reusable Question Card ---
function QuestionCard({
  question: initialQuestion,
  isHostOrAdmin,
  onActionComplete,
}: {
  question: QuestionData;
  isHostOrAdmin: boolean;
  onActionComplete: () => void; // Callback to trigger list refresh
}) {
  // TODO: Add state and handlers for Approve/Delete/Answer actions later
  const [isAnswering, setIsAnswering] = useState(false);
  const [question, setQuestion] = useState(initialQuestion);
  const [answerValue, setAnswerValue] = useState(question.answerText ?? "");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState<
    false | "approve" | "delete"
  >(false);
  const router = useRouter();

  // --- API Call Helper for Question Actions ---
  const handleQuestionAction = async (
    action: () => Promise<Response>,
    loadingMessage: string,
    successMessage: string,
    errorMessagePrefix: string,
    actionType: "approve" | "delete" | "answer"
  ) => {
    if (actionType === "answer") setIsSubmittingAnswer(true);
    else setIsLoadingAction(actionType);

    const toastId = toast.loading(loadingMessage);
    let response: Response | null = null;
    try {
      const response = await action();
      // Handle potential 204 from DELETE

      if (!response.ok) {
        let errorMsg = `Error ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch (jsonError) {
                     errorMsg = await response.text() || response.statusText || errorMsg;
                }
                throw new Error(errorMsg);
      }

      const responseData = response.status !== 204 ? await response.json() : null;
      toast.success(successMessage, { id: toastId });
      // Update local state *or* trigger parent refresh
      if (responseData && actionType !== "delete") {
        // Anonymize if needed before setting state
        const processedData = {
          ...responseData,
          submittedBy: responseData.isAnonymous
            ? null
            : responseData.submittedBy,
          submittedById: responseData.isAnonymous
            ? null
            : responseData.submittedById,
        };
        setQuestion(processedData as QuestionData); // Update card state
        setAnswerValue(processedData.answerText ?? ""); // Update answer field if answered
        setIsAnswering(false); // Close answer form if it was open
      }
      onActionComplete(); // Notify parent list to refresh
    } catch (error: any) {
      console.error(`${errorMessagePrefix} error:`, error);
      toast.error(`${errorMessagePrefix}: ${error.message}`, { id: toastId });
    } finally {
      if (actionType === "answer") setIsSubmittingAnswer(false);
      else setIsLoadingAction(false);
    }
  };

  // --- Specific Handlers ---
  const handleApprove = () =>
    handleQuestionAction(
      () =>
        fetch(`/api/ama/questions/${question.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isApproved: true }),
        }),
      "Approving question...",
      "Question approved!",
      "Approval failed",
      "approve"
    );

  const handleDelete = () => {
    if (
      !confirm(
        "Are you sure you want to delete this question? This cannot be undone."
      )
    )
      return;
    handleQuestionAction(
      () => fetch(`/api/ama/questions/${question.id}`, { method: "DELETE" }),
      "Deleting question...",
      "Question deleted.",
      "Delete failed",
      "delete"
    );
  };

  const handleAnswerSubmit = () =>
    handleQuestionAction(
      () =>
        fetch(`/api/ama/questions/${question.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answerText: answerValue.trim() }), // Send trimmed answer
        }),
      "Submitting answer...",
      "Answer submitted!",
      "Answer submission failed",
      "answer"
    );

  // --- Render logic (uses local 'question' state now) ---
  // Important: Check initialQuestion props if needed, but render based on 'question' state
  if (!question) return null; // Should not happen if action !== delete, but safety check
  return (
    <Card
      className={`transition-opacity duration-300 ${
        !question.isApproved && !isHostOrAdmin ? "hidden" : ""
      } ${
        !question.isApproved && isHostOrAdmin
          ? "border-amber-500/50 bg-amber-50/30 dark:bg-amber-900/10"
          : ""
      }`}
    >
      <CardContent className="pt-5 pb-4 space-y-3">
        {/* Question Text & Submitter Info */}
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={question.submittedBy?.image ?? undefined} />
            <AvatarFallback>
              {getInitials(question.submittedBy?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <p className="text-sm text-foreground mb-1">{question.text}</p>
            <p className="text-xs text-muted-foreground">
              Asked{" "}
              {formatDistanceToNow(question.createdAt, { addSuffix: true })}
              {question.submittedBy &&
                ` by ${question.submittedBy.name ?? "User"}`}
              {question.isAnonymous && ` (Anonymous)`}
            </p>
          </div>
          {!question.isApproved && isHostOrAdmin && (
            <Badge
              variant="secondary"
              className="text-xs h-fit bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
            >
              Pending
            </Badge>
          )}
        </div>

        {/* Answer Section (if answered) */}
        {question.isApproved && question.answerText && (
          <div className="pl-11 mt-3 pt-3 border-t border-dashed">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={question.answeredBy?.image ?? undefined} />
                <AvatarFallback>
                  {getInitials(question.answeredBy?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <p className="text-sm text-foreground/90 mb-1">
                  {question.answerText}
                </p>
                <p className="text-xs text-muted-foreground">
                  Answered{" "}
                  {formatDistanceToNow(question.answeredAt!, {
                    addSuffix: true,
                  })}
                  {question.answeredBy &&
                    ` by ${question.answeredBy.name ?? "Host"}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Answer Form (if approved, not answered, and is Host/Admin) */}
        {isHostOrAdmin && question.isApproved && !question.answerText && (
          <div className="pl-11 mt-3 pt-3 border-t border-dashed">
            {!isAnswering ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAnswering(true)}
              >
                {" "}
                <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Answer{" "}
              </Button>
            ) : (
              <div className="space-y-2">
                <Textarea
                  placeholder="Your answer..."
                  value={answerValue}
                  onChange={(e) => setAnswerValue(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAnswering(false);
                      setAnswerValue("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAnswerSubmit}
                    disabled={!answerValue.trim() || isSubmittingAnswer}
                  >
                    {isSubmittingAnswer && (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    )}
                    Submit Answer
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Host/Admin Actions Footer */}
      {isHostOrAdmin && (
        <CardFooter className="py-2 px-4 border-t bg-muted/30 flex justify-end gap-2">
          {!question.isApproved && (
            <Button variant="outline" size="sm" onClick={handleApprove}>
              {" "}
              <Check className="h-4 w-4 mr-1.5" /> Approve{" "}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleDelete}
          >
            {" "}
            <Trash2 className="h-4 w-4 mr-1.5" /> Delete{" "}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

// --- Main List Component ---
export function QuestionList({ sessionId, isHostOrAdmin }: QuestionListProps) {
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Key for forcing re-fetch
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(() => {
    // Wrap fetch logic in useCallback
    setIsLoading(true);
    setError(null);
    const apiUrl = `/api/ama/sessions/${sessionId}/questions`;
   
    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load questions");
        return res.json();
      })
      .then((data: QuestionData[]) => {
       
        setQuestions(data);
      })
      .catch((err) => {
        console.error("Error fetching questions:", err);
        setError(err.message || "Could not fetch questions.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [sessionId]); // Depend on sessionId
  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const handleActionComplete = useCallback(() => {
    setRefreshKey((prev) => prev + 1); // Increment key to trigger useEffect re-run
  }, []);
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Filter questions further on client if needed, or rely on API filtering
  const displayQuestions = isHostOrAdmin
    ? questions // Host/Admin sees all fetched questions (API should filter based on role if needed)
    : questions.filter((q) => q.isApproved && q.answerText); // Regular users see only approved & answered

  if (displayQuestions.length === 0) {
    return (
      <Alert>
        <MessageSquare className="h-4 w-4" />
        <AlertTitle>No Questions Yet</AlertTitle>
        <AlertDescription>
          {isHostOrAdmin
            ? "No questions have been submitted or approved for this session yet."
            : "No answered questions available for this session yet. Check back later!"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Render questions, passing role for conditional rendering */}
      {questions.map(
        (
          q // Iterate over all fetched questions for card rendering logic
        ) => (
          <QuestionCard
            key={q.id}
            question={q}
            isHostOrAdmin={isHostOrAdmin}
            onActionComplete={handleActionComplete}
          />
        )
      )}
    </div>
  );
}

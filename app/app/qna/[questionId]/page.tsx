"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, MessageSquarePlus, AlertCircle } from "lucide-react";

// Import components
import { AnswerForm } from "@/components/qna/answer-form";
import type { DetailedQuestion } from "@/lib/qna";
import { AnswerList, AnswerListSkeleton } from "@/components/qna/AnswerList";
import {
  QuestionDetail,
  QuestionDetailSkeleton,
} from "@/components/qna/QuestionDetail";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function QuestionPage() {
  const params = useParams();
  const questionId = params.questionId as string;
  const { data: session, status: sessionStatus } = useSession();
  const currentUserId = session?.user?.id;

  const [questionData, setQuestionData] = useState<DetailedQuestion | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnswerDialogOpen, setIsAnswerDialogOpen] = useState(false);

  // Data Fetching
  const fetchQuestionDetails = useCallback(async () => {
    if (!questionId) return;

    setIsLoading(true);
    setError(null);
    const apiUrl = `/api/qna/questions/${questionId}`;

    try {
      const response = await fetch(apiUrl);
      if (response.status === 404) {
        throw new Error("Question not found.");
      }
      if (!response.ok) {
        throw new Error(
          `Failed to fetch question (status: ${response.status})`
        );
      }
      const data: DetailedQuestion = await response.json();
      setQuestionData(data);
    } catch (err: any) {
      console.error("Error fetching question details:", err);
      setError(err.message || "An unknown error occurred");
      setQuestionData(null);
      toast.error("Error", {
        description:
          err.message === "Question not found."
            ? err.message
            : "Could not load question details.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    fetchQuestionDetails();
  }, [fetchQuestionDetails, questionId]);

  // Handle new answer submission
  const handleAnswerAdded = useCallback(() => {
    setIsAnswerDialogOpen(false);
    fetchQuestionDetails();
    toast.success("Success", { description: "Your answer has been posted." });
  }, [fetchQuestionDetails]);

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 md:px-6">
      <Button variant="outline" size="sm" className="mb-6" asChild>
        <Link href="/app/qna">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Questions
        </Link>
      </Button>

      {isLoading ? (
        <div className="space-y-8">
          <QuestionDetailSkeleton />
          <AnswerListSkeleton />
        </div>
      ) : error ? (
        <div className="text-center py-10 border rounded-lg">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Question</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={fetchQuestionDetails}>
            Retry
          </Button>
        </div>
      ) : questionData ? (
        <div className="space-y-8">
          {/* Question Details */}
          <QuestionDetail question={questionData} />

          {/* Answer List */}
          <div id="answer-list">
            <AnswerList
              questionId={questionId}
              answers={questionData.answers || []}
              questionAuthorId={questionData.author.id}
              currentUserId={currentUserId}
            />
          </div>

          {/* Answer Form/Dialog */}
          {sessionStatus === "authenticated" && (
            <div className="mt-10 text-center border-t pt-8">
              <Dialog
                open={isAnswerDialogOpen}
                onOpenChange={setIsAnswerDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="lg" className="px-6">
                    <MessageSquarePlus className="mr-2 h-5 w-5" />
                    Add Your Answer
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px]">
                  <DialogHeader>
                    <DialogTitle>Your Answer</DialogTitle>
                    <DialogDescription>
                      Share your knowledge and help answer the question.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <AnswerForm
                      questionId={questionId}
                      onAnswerAdded={handleAnswerAdded}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {sessionStatus === "unauthenticated" && (
            <div className="text-center border-t pt-8 mt-8">
              <p className="text-muted-foreground">
                You must be{" "}
                <Link
                  href="/api/auth/signin"
                  className="text-primary hover:underline font-medium"
                >
                  signed in
                </Link>{" "}
                to post an answer.
              </p>
            </div>
          )}

          {sessionStatus === "loading" && (
            <Skeleton className="h-40 w-full mt-8" />
          )}
        </div>
      ) : null}
    </div>
  );
}

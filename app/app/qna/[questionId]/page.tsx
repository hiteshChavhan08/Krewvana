// app\app\qna\[questionId]\page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

// UI Components
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, MessageSquarePlus, AlertCircle } from "lucide-react"; // Keep MessageSquarePlus
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger, // Keep Dialog imports
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator"; // Added Separator

// QnA Components
import { AnswerForm } from "@/components/qna/answer-form";
import type { DetailedQuestion } from "@/lib/qna";
import { AnswerList, AnswerListSkeleton } from "@/components/qna/AnswerList";
import {
  QuestionDetail,
  QuestionDetailSkeleton,
} from "@/components/qna/QuestionDetail";

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
  const [isAnswerDialogOpen, setIsAnswerDialogOpen] = useState(false); // Keep Dialog state

  // Data Fetching (remains the same)
  const fetchQuestionDetails = useCallback(async () => {
    if (!questionId) return;
    // Reset states only if not already loading to prevent loops on rapid triggers
    // if (!isLoading) {
    //    setIsLoading(true);
    //    setError(null);
    // }
    // Safer: Just ensure loading is true at start
    setIsLoading(true);
    setError(null);

    const apiUrl = `/api/qna/questions/${questionId}`;
    try {
      const response = await fetch(apiUrl);
      if (response.status === 404) throw new Error("Question not found.");
      if (!response.ok)
        throw new Error(
          `Failed to fetch question (status: ${response.status})`
        );
      const data: DetailedQuestion = await response.json();
      setQuestionData(data);
    } catch (err: any) {
      console.error("Error fetching question details:", err);
      const message = err.message || "An unknown error occurred";
      setError(message);
      setQuestionData(null);
      toast.error("Error Loading Question", { description: message });
    } finally {
      setIsLoading(false);
    }
  }, [questionId]); // Removed isLoading from dependencies

  useEffect(() => {
    fetchQuestionDetails();
  }, [fetchQuestionDetails]); // Trigger fetch on mount / questionId change

  // Handle new answer submission (restored Dialog closing)
  const handleAnswerAdded = useCallback(() => {
    setIsAnswerDialogOpen(false); // Close dialog on success
    const toastId = toast.loading("Refreshing question data...");
    fetchQuestionDetails()
      .then(() => {
        toast.success("Answer Posted", {
          description: "Your answer has been added.",
          id: toastId,
        });
      })
      .catch(() => {
        toast.error("Refresh Failed", {
          description: "Could not reload question data.",
          id: toastId,
        });
      });
  }, [fetchQuestionDetails]); // Depends only on fetch function

  // --- Render Logic ---

  // Loading State
  if (isLoading && !questionData) {
    // Show full skeleton only on initial load
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4 md:px-6 space-y-8">
        <Skeleton className="h-8 w-40 mb-6" />
        <QuestionDetailSkeleton />
        {/* Placeholder for Answer Button */}
        <Skeleton className="h-10 w-48 rounded-lg" />
        <AnswerListSkeleton />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4 md:px-6">
        <Button variant="outline" size="sm" className="mb-6">
          <Link href="/app/qna" className="flex items-center">
            {" "}
            {/* Ensure Link is the direct child */}
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Questions
          </Link>
        </Button>
        <div className="text-center py-10 border rounded-lg bg-destructive/5">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-destructive">
            Error Loading Question
          </h2>
          <p className="text-destructive/90 mb-4">{error}</p>
          <Button variant="outline" onClick={fetchQuestionDetails}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // No Data Fallback (should be rare if error handling works)
  if (!questionData) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4 md:px-6">
        <p>Question data could not be loaded.</p>
      </div>
    );
  }

  // --- Main Content Rendering ---
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 md:px-6">
      {/* Back Button */}
      <Button variant="outline" size="sm" className="mb-6">
        <Link href="/app/qna" className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Questions
        </Link>
      </Button>

      {/* Main Content Wrapper */}
      <div className="space-y-8">
        {/* 1. Question Details */}
        <QuestionDetail question={questionData} />

        {/* ================================================== */}
        {/* 2. Trigger Button for Answer Dialog (MOVED HERE) */}
        {/* ================================================== */}
        <Dialog open={isAnswerDialogOpen} onOpenChange={setIsAnswerDialogOpen}>
          {/* Only show trigger if logged in */}
          {sessionStatus === "authenticated" && (
            <DialogTrigger asChild>
              <Button
                size="default"
                variant="default"
                className="w-full md:w-auto"
              >
                {" "}
                {/* Make button distinct */}
                <MessageSquarePlus className="mr-2 h-5 w-5" />
                Post Your Answer
              </Button>
            </DialogTrigger>
          )}

          {/* Unauthenticated prompt */}
          {sessionStatus === "unauthenticated" && (
            <div className="text-center my-4 p-4 bg-muted/40 rounded-lg border border-dashed">
              <p className="text-muted-foreground text-sm">
                Please{" "}
                <Link
                  href={`/api/auth/signin?callbackUrl=${encodeURIComponent(
                    `/app/qna/${questionId}`
                  )}`}
                  className="text-primary hover:underline font-medium"
                >
                  sign in
                </Link>{" "}
                to post an answer.
              </p>
            </div>
          )}

          {/* Loading prompt */}
          {sessionStatus === "loading" && (
            <Skeleton className="h-10 w-full md:w-48 rounded-lg" />
          )}

          {/* Dialog Content remains defined here but triggered from above */}
          <DialogContent
            // Apply classes for max width/height
            className="sm:max-w-[90vw] md:max-w-[90vw] lg:max-w-[90vw] xl:max-w-[900px] max-h-[90vh] flex flex-col"
            onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focusing first element if needed
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Your Answer</DialogTitle>
              <DialogDescription>
                Share your knowledge and help answer the question below.
              </DialogDescription>
            </DialogHeader>
            {/* Make content scrollable */}
            <div className="py-4 px-4 flex-grow overflow-y-auto">
              <AnswerForm
                questionId={questionId}
                onAnswerAdded={handleAnswerAdded}
              />
            </div>
          </DialogContent>
        </Dialog>
        {/* ================================================== */}
        {/* End of Dialog Trigger Section                     */}
        {/* ================================================== */}

        {/* Optional Separator */}
        <Separator />

        {/* 3. Answer List */}
        <div id="answer-list">
          <AnswerList
            questionId={questionId}
            answers={questionData?.answers || []}
            questionAuthorId={questionData.author.id}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </div>
  );
}

// src/components/ama-session/ama-question-feed.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { CurrentUserData, AMAQuestionData } from "@/types/types";
import { AMASessionStatus } from "@prisma/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { toast } from "sonner";

// Import the Question Card component
import { AmaQuestionCard } from "@/components/ama/ama-question-card";
// Optional: Magic UI for list animations
import { AnimatedList } from "@/components/magicui/animated-list";

interface AmaQuestionFeedProps {
  sessionId: string;
  sessionStatus: AMASessionStatus;
  currentUser: CurrentUserData;
  isHostOrAdmin: boolean;
  refreshTrigger: number; // Listen to this prop change for manual refresh
}

const POLLING_INTERVAL_MS = 15000; // Fetch every 15 seconds

export function AmaQuestionFeed({
  sessionId,
  sessionStatus,
  currentUser,
  isHostOrAdmin,
  refreshTrigger,
}: AmaQuestionFeedProps) {
  const [questions, setQuestions] = useState<AMAQuestionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    // Don't show loading skeleton on subsequent polls unless it's the very first fetch
    if (questions.length === 0) setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ama/sessions/${sessionId}/questions`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch questions (status: ${response.status})`
        );
      }
      const data: AMAQuestionData[] = await response.json();
      setQuestions(data);
    } catch (err: any) {
      console.error("Error fetching questions:", err);
      setError(err.message || "Could not load questions.");
      toast.error("Failed to fetch questions.");
    } finally {
      // Only set loading false after the first fetch completes
      if (isLoading) setIsLoading(false);
    }
  }, [sessionId, isLoading, questions.length]); // Include isLoading and question length to manage initial load state

  // Initial fetch and refetch on trigger change
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions, refreshTrigger]); // Run fetchQuestions when trigger changes

  // Polling effect
  useEffect(() => {
    // Only poll if the session is active or upcoming
    if (
      sessionStatus === AMASessionStatus.LIVE ||
      sessionStatus === AMASessionStatus.UPCOMING
    ) {
      const intervalId = setInterval(fetchQuestions, POLLING_INTERVAL_MS);
      // Cleanup interval on component unmount or when status changes
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [sessionStatus, fetchQuestions]); // Rerun effect if status or fetch function changes

  // --- Callbacks for Question Card Actions ---
  const handleQuestionAnswered = useCallback(
    (updatedQuestion: AMAQuestionData) => {
      setQuestions((prev) =>
        prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q))
      );
      toast.success("Answer submitted!");
    },
    []
  );

  const handleQuestionDeleted = useCallback((deletedQuestionId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== deletedQuestionId));
    toast.success("Question deleted.");
  }, []);

  // --- Render Logic ---
  if (isLoading) {
    return <QuestionFeedSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error Loading Questions</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (questions.length === 0) {
    return (
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>No Questions Yet</AlertTitle>
        <AlertDescription>
          Be the first one to ask a question using the form above!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight">
        Questions ({questions.length})
      </h2>
      {/* Optional: Wrap list items with Magic UI AnimatedList */}
      {/* <AnimatedList> */}
      {questions.map((question) => (
        <AmaQuestionCard
          key={question.id}
          question={question}
          currentUser={currentUser}
          isHostOrAdmin={isHostOrAdmin}
          onQuestionAnswered={handleQuestionAnswered}
          onQuestionDeleted={handleQuestionDeleted}
        />
      ))}
      {/* </AnimatedList> */}
    </div>
  );
}

// Loading skeleton for the feed
const QuestionFeedSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-8 w-48" /> {/* Title skeleton */}
    <div className="space-y-4">
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  </div>
);

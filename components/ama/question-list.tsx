"use client";

import { useState, useEffect, useCallback } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Loader2 } from "lucide-react"; // Added Loader2 for loading skeleton
import { QuestionCard } from "@/components/ama/question-card"; // Assuming this is your component
import { MagicCard } from "@/components/magicui/magic-card"; // Import MagicCard (adjust path)
import { ShineBorder } from "@/components/magicui/shine-border"; // Import ShineBorder (adjust path)
import { AMASessionStatus } from "@prisma/client";

// Define types (assuming QuestionData is the same)
type QuestionData = {
  id: string;
  text: string;
  isAnonymous: boolean;
  isApproved: boolean;
  answerText: string | null;
  answeredAt: string | Date | null;
  createdAt: string | Date;
  submittedBy: { id: string; name: string | null; image: string | null } | null;
  answeredBy: { id: string; name: string | null; image: string | null } | null;
};

interface QuestionListProps {
  sessionId: string;
  isHostOrAdmin: boolean;
  sessionStatus: AMASessionStatus;
}

const POLLING_INTERVAL_MS = 10000;

export function QuestionList({
  sessionId,
  isHostOrAdmin,
  sessionStatus,
}: QuestionListProps) {
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(
    async (showLoading = true) => {
      // ... (fetchData implementation remains the same)
      if (showLoading) setIsLoading(true);
      setError(null);
      const apiUrl = `/api/ama/sessions/${sessionId}/questions`;
      try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("Failed to load questions");
        const data: QuestionData[] = await res.json();
        setQuestions(data);
      } catch (err: any) {
        console.error("Error fetching questions:", err);
        setError(err.message || "Could not fetch questions.");
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [sessionId]
  );

  const pollData = useCallback(async () => {
    // ... (pollData implementation remains the same)
    setError(null);
    const apiUrl = `/api/ama/sessions/${sessionId}/questions`;
    try {
      const res = await fetch(apiUrl, { cache: "no-store" });
      if (!res.ok) throw new Error("Polling failed to load questions");
      const data: QuestionData[] = await res.json();

      const areDifferent = JSON.stringify(data) !== JSON.stringify(questions);
    } catch (err: any) {
      console.warn("Error polling questions:", err);
    }
  }, [sessionId, questions]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (sessionStatus === AMASessionStatus.LIVE) {
      intervalId = setInterval(pollData, POLLING_INTERVAL_MS);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [sessionStatus, pollData]);

  const handleActionComplete = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const filteredQuestions = questions.filter((q) => {
    const searchMatch = searchQuery
      ? q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.answerText?.toLowerCase().includes(searchQuery.toLowerCase()) ??
          false)
      : true;
    return searchMatch;
  });

  // --- Loading State ---
  if (isLoading) {
    // You could potentially use Magic UI's skeleton components here too
    return (
      <div className="space-y-4">
        {/* Search Skeleton */}
        <div className="h-10 w-full bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse mb-6"></div>
        {/* Question Card Skeletons */}
        <div className="space-y-6">
          {[...Array(2)].map((_, index) => (
            <div
              key={index}
              className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 animate-pulse"
            >
              {/* Simplified Skeleton Structure */}
              <div className="h-4 w-1/4 bg-neutral-300 dark:bg-neutral-700 rounded mb-2"></div>
              <div className="h-4 w-3/4 bg-neutral-300 dark:bg-neutral-700 rounded mb-2"></div>
              <div className="h-4 w-1/2 bg-neutral-300 dark:bg-neutral-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      // Wrap error Alert with ShineBorder for emphasis
      <ShineBorder
        className="p-4 text-center text-xl capitalize" // Adjust styling as needed
        shineColor={["#FF0000", "#E00000"]} // Red colors for error
      >
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </ShineBorder>
    );
  }

  // --- Content: Search, No Results, or List ---
  return (
    <div className="space-y-6">
      {/* Search input with ShineBorder */}
      <ShineBorder
        className="relative w-full rounded-lg"
        shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} // Example colors
        borderWidth={1} // Adjust border width if needed
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input
          placeholder="Search questions or answers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          // Make input background transparent to see border effect, adjust padding
          className="pl-9 w-full bg-transparent focus:outline-none focus:ring-0 border-none"
        />
      </ShineBorder>

      {/* No Questions Message */}
      {filteredQuestions.length === 0 ? (
        // Wrap "No Questions" Alert with ShineBorder
        <ShineBorder
          className="rounded-lg"
          shineColor={["#00A4FF", "#A07CFE"]} // Example colors
          borderWidth={1}
        >
          <Alert className="bg-background border-none">
            {" "}
            {/* Remove default alert border */}
            <MessageSquare className="h-4 w-4" />
            <AlertTitle>No Questions Found</AlertTitle>
            <AlertDescription>
              {searchQuery
                ? "No questions match your search criteria."
                : isHostOrAdmin
                ? "No questions pending approval or answered yet."
                : "No answered questions available for this session yet."}
            </AlertDescription>
          </Alert>
        </ShineBorder>
      ) : (
        // Question List with MagicCard applied to each QuestionCard
        <div className="space-y-6">
          {filteredQuestions.map((q) => (
            // Apply MagicCard wrapper around your existing QuestionCard
            <MagicCard
              key={q.id}
              className="cursor-pointer shadow-md" // Add base styling
              gradientColor="var(--neutral-800)" // Or use theme colors
              // Adjust size props if needed, default might be fine
              // size={...}
            >
              {/* Render your actual QuestionCard component inside */}
              <QuestionCard
                // Pass necessary props to your QuestionCard
                question={q}
                isHostOrAdmin={isHostOrAdmin}
                onActionComplete={handleActionComplete}
                // Ensure QuestionCard itself doesn't have conflicting background/border styles
                // or adjust MagicCard props accordingly.
              />
            </MagicCard>
          ))}
        </div>
      )}
    </div>
  );
}

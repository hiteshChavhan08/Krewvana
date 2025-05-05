// app/(main)/questions/[questionId]/page.tsx
"use client"; // Make this a Client Component

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation'; // Hook to get dynamic route params
import Link from 'next/link';
import { useSession } from 'next-auth/react'; // To check user auth status

import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

// Import the components we will create next
// import { QuestionDetail, QuestionDetailSkeleton } from '@/components/qna/';
// import { AnswerList, AnswerListSkeleton } from '@/components/qna/';
import { AnswerForm } from '@/components/qna/answer-form';
import { DetailedQuestion } from '@/lib/qna';
import { AnswerList } from '@/components/qna/AnswerList';
import { AnswerListSkeleton } from '@/components/qna/AnswerListSkeleton';
import { QuestionDetail } from '@/components/qna/QuestionDetail';
import { QuestionDetailSkeleton } from '@/components/qna/QuestionDetailSkeleton';

// Import the type for the detailed question data from the API response
// You might want to define this in a shared types file later
// import type { DetailedQuestion } from '@/types/qna'; // Assuming you create this type

// --- Main Page Component ---
export default function QuestionPage() {
  const params = useParams(); // Get route parameters { questionId: '...' }
  const questionId = params.questionId as string;
  console.log("--- QuestionPage trying to fetch ID:", questionId); 
  const { data: session, status: sessionStatus } = useSession(); // Get user session
  

  const [questionData, setQuestionData] = useState<DetailedQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---
  const fetchQuestionDetails = useCallback(async () => {
    if (!questionId) return; // Don't fetch if ID is missing

    setIsLoading(true);
    setError(null);
    const apiUrl = `/api/qna/questions/${questionId}`;

    try {
      const response = await fetch(apiUrl);
      if (response.status === 404) {
        throw new Error('Question not found.');
      }
      if (!response.ok) {
        throw new Error(`Failed to fetch question (status: ${response.status})`);
      }
      const data: DetailedQuestion = await response.json();
      setQuestionData(data);
    } catch (err: any) {
      console.error("Error fetching question details:", err);
      setError(err.message || 'An unknown error occurred');
      setQuestionData(null);
      toast.error("Error",
        {description: err.message === 'Question not found.' ? err.message : "Could not load question details.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [questionId, toast]);

  useEffect(() => {
    fetchQuestionDetails();
  }, [fetchQuestionDetails]); // Fetch when component mounts or ID changes


  // --- Callback function for when a new answer is submitted ---
  // This will be passed down to AnswerForm
  const handleAnswerAdded = () => {
    // Re-fetch question details to include the new answer
    // This is a simple way; more advanced state management could update locally first
    fetchQuestionDetails();
    // Optionally scroll to the new answer or show a success toast
    toast.success("Success", {description: "Your answer has been posted." });
  };


  // --- Render Logic ---
  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
       <Button variant="outline" size="sm" className="mb-6" asChild>
          <Link href="/app/qna">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Questions
          </Link>
       </Button>

      {isLoading ? (
        // Show skeletons for question and answers while loading
        <div className="space-y-8">
            <QuestionDetailSkeleton />
            <AnswerListSkeleton />
        </div>
      ) : error ? (
        // Show error message
        <div className="text-center py-10 border rounded-lg text-destructive">
          <h2 className="text-xl font-semibold mb-2">Error Loading Question</h2>
          <p>{error}</p>
          {/* Optionally add a retry button */}
          <Button variant="outline" onClick={fetchQuestionDetails} className="mt-4">
            Retry
          </Button>
        </div>
      ) : questionData ? (
        // Display Question and Answers if data loaded successfully
        <div className="space-y-8">
          {/* Question Details Component */}
          <QuestionDetail question={questionData} />

          {/* Answer List Component */}
          <AnswerList
             questionId={questionId}
             answers={questionData.answers || []}
             questionAuthorId={questionData.author.id}
          />

          {/* Answer Form Component (only if user is logged in) */}
          {sessionStatus === 'authenticated' && (
              <div>
                 <h2 className="text-2xl font-semibold mb-4 border-t pt-8">Your Answer</h2>
                 <AnswerForm
                    questionId={questionId}
                    onAnswerAdded={handleAnswerAdded}
                 />
              </div>
           )}
           {sessionStatus === 'unauthenticated' && (
                <div className="text-center border-t pt-8 mt-8">
                    <p className="text-muted-foreground">
                        You must be <Link href="/api/auth/signin" className="text-primary hover:underline">signed in</Link> to post an answer.
                    </p>
                </div>
            )}
             {sessionStatus === 'loading' && (
                <Skeleton className="h-40 w-full mt-8" /> // Placeholder while session loads
             )}
        </div>
      ) : null /* Should not happen if not loading and no error, but handles edge case */}
    </div>
  );
}
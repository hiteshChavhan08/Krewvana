// app/(main)/questions/page.tsx
"use client"; // <-- Add this directive

import { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation"; // Import hooks

// Keep Prisma types for data structure reference
import { Prisma } from "@prisma/client";
import { QuestionListItem } from "@/components/qna/question-form-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner"; // For error feedback

// Define the structure of the fetched question data (matches API response)
type QuestionWithDetails = Prisma.QuestionGetPayload<{
  include: {
    author: { select: { id: true; name: true; image: true } };
    tags: { include: { tag: { select: { name: true; id: true } } } };
    _count: { select: { answers: true; votes: true } };
    acceptedAnswer: { select: { id: true } };
  };
}>;

// Define the structure for pagination metadata from the API
interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// --- Loading Skeleton Component (remains the same) ---
function QuestionListSkeleton({ count = 5 }: { count?: number }) {
  // ... (skeleton code as before) ...
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="border p-4 rounded-lg flex gap-4">
          <div className="flex flex-col items-center space-y-1 text-sm text-muted-foreground min-w-[60px]">
            <Skeleton className="h-5 w-8" />
            <span>votes</span>
            <Skeleton className="h-5 w-8" />
            <span>answers</span>
          </div>
          <div className="flex-grow space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="flex justify-end items-center pt-2">
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Main Page Component (Now Client Component) ---
export default function QuestionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams(); // Get current search params

  // Client-side state
  const [questions, setQuestions] = useState<QuestionWithDetails[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current params from hook
  const currentPage = parseInt(searchParams.get("page") || "1");
  const currentLimit = parseInt(searchParams.get("limit") || "10");
  const currentTag = searchParams.get("tag");
  const currentSortBy = searchParams.get("sortBy") || "createdAt";
  const currentOrder = searchParams.get("order") || "desc";

  // Function to create URL search string from params
  const createQueryString = useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(params)) {
        if (value === null || value === undefined) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      }
      return newSearchParams.toString();
    },
    [searchParams]
  );

  // Effect to fetch data when searchParams change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      // Construct the API URL using current searchParams
      const query = createQueryString({
        page: currentPage,
        limit: currentLimit,
        tag: currentTag,
        sortBy: currentSortBy,
        order: currentOrder,
      });
      const apiUrl = `/api/questions?${query}`;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch questions (status: ${response.status})`
          );
        }
        const result = await response.json();
        setQuestions(result.data);
        setMeta(result.meta);
      } catch (err: any) {
        console.error("Error fetching questions:", err);
        setError(err.message || "An unknown error occurred");
        setQuestions([]); // Clear questions on error
        setMeta(null); // Clear meta on error
        toast.error("Error", {
          description: "Could not load questions. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // Re-run effect when relevant search params change
  }, [
    searchParams,
    currentPage,
    currentLimit,
    currentTag,
    currentSortBy,
    currentOrder,
    createQueryString,
    toast,
  ]); // Add dependencies

  // --- Event Handlers for Pagination/Filtering (Example) ---
  const handlePageChange = (newPage: number) => {
    const query = createQueryString({ page: newPage });
    router.push(`${pathname}?${query}`); // Update URL, triggers useEffect
  };

  // --- Render Logic ---
  const pageTitle = currentTag ? (
    <>
      Questions tagged{" "}
      <Badge variant="secondary" className="text-2xl align-middle ml-2">
        {currentTag}
      </Badge>
    </>
  ) : (
    "All Questions"
  );

  return (
    <div className="container mx-auto py-8 px-4 md:px-4">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold">{pageTitle}</h1>
        <Button asChild>
          <Link href="/app/qna/ask">Ask Question</Link>
        </Button>
      </div>

      {/* TODO: Add Client-side Sorting/Filtering controls here later */}
      {meta && (
        <p className="text-muted-foreground mb-4">
          {meta.total} questions found
        </p>
      )}

      {/* Display Loading, Error, or Content */}
      {isLoading ? (
        <QuestionListSkeleton />
      ) : error ? (
        <div className="text-center py-10 border rounded-lg text-destructive">
          <h2 className="text-xl font-semibold mb-2">
            Error Loading Questions
          </h2>
          <p>{error}</p>
          {/* Optionally add a retry button */}
        </div>
      ) : questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionListItem key={question.id} question={question} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">No Questions Found</h2>
          <p className="text-muted-foreground">
            {currentTag
              ? `There are no questions tagged with "${currentTag}" yet.`
              : "There are no questions yet."}
          </p>
          {!currentTag && (
            <Button asChild variant="link" className="mt-2">
              <Link href="/app/qna/ask">Be the first to ask!</Link>
            </Button>
          )}
        </div>
      )}

      {/* Pagination Controls (Using client state and handlers) */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <Button
            variant="outline"
            disabled={isLoading || meta.page <= 1}
            onClick={() => handlePageChange(meta.page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={isLoading || meta.page >= meta.totalPages}
            onClick={() => handlePageChange(meta.page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

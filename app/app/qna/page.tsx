// app/qna/page.tsx (or your main questions list page)
"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { QuestionListItem } from "@/components/qna/question-form-list"; // Use the compact list item
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; // Using compact skeleton now
import { toast } from "sonner";
import { Search, Filter, PlusCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// --- Types ---
type QuestionWithDetails = Prisma.QuestionGetPayload<{
  include: {
    author: { select: { id: true; name: true; image: true } };
    tags: { include: { tag: { select: { name: true; id: true } } } };
    _count: { select: { answers: true; votes: true /* comments: true */ } };
    acceptedAnswer: { select: { id: true } };
  };
}>;

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ApiResponse {
  data: QuestionWithDetails[];
  meta: PaginationMeta;
}

// --- Loading Skeleton Component (Compact Version) ---
function QuestionListSkeleton({ count = 8 }: { count?: number }) {
  // Increased count for compact view
  return (
    <div className="space-y-3">
      {" "}
      {/* Reduced space */}
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-4">
            {" "}
            {/* Use same padding as real item */}
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-3/4 rounded-md mb-1" /> {/* Title */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {" "}
                {/* Tags */}
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-muted/50">
                {" "}
                {/* Footer */}
                <div className="flex items-center gap-3">
                  {" "}
                  {/* Stats */}
                  <Skeleton className="h-4 w-8 rounded-md" />
                  <Skeleton className="h-4 w-8 rounded-md" />
                </div>
                <div className="flex items-center gap-1.5">
                  {" "}
                  {/* Author */}
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// --- Main Page Component ---
export default function QuestionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Client-side state
  const [questions, setQuestions] = useState<QuestionWithDetails[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  ); // Initialize from URL

  // Get current params from hook for dependency array and initial load
  const currentPage = Number.parseInt(searchParams.get("page") || "1");
  const currentLimit = Number.parseInt(searchParams.get("limit") || "15"); // Default to more items for compact view
  const currentTag = searchParams.get("tag");
  const currentSearch = searchParams.get("search");
  const currentSortBy = searchParams.get("sortBy") || "createdAt";
  const currentOrder = searchParams.get("order") || "desc";

  // Function to create URL search string from params
  const createQueryString = useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(params)) {
        if (value === null || value === undefined || value === "") {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      }
      return newSearchParams.toString();
    },
    [searchParams] // Recreate only if base searchParams change
  );

  // Effect to fetch data when relevant searchParams change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      // Construct the API URL using current searchParams from the hook
      const query = createQueryString({
        page: currentPage,
        limit: currentLimit,
        tag: currentTag,
        search: currentSearch, // Include search term from URL
        sortBy: currentSortBy,
        order: currentOrder,
      });
      const apiUrl = `/api/qna/questions?${query}`; // Ensure correct API endpoint

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            message: `HTTP error! status: ${response.status}`,
          }));
          throw new Error(
            errorData.message ||
              `Failed to fetch questions (status: ${response.status})`
          );
        }
        const result: ApiResponse = await response.json();
        setQuestions(result.data);
        setMeta(result.meta);
      } catch (err: any) {
        console.error("Error fetching questions:", err);
        const errorMessage = err.message || "An unknown error occurred";
        setError(errorMessage);
        setQuestions([]);
        setMeta(null);
        toast.error("Error Loading Questions", {
          description: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [
    currentPage,
    currentLimit,
    currentTag,
    currentSearch,
    currentSortBy,
    currentOrder,
    createQueryString,
  ]); // Add createQueryString dependency

  // --- Event Handlers ---
  const navigateWithParams = (
    newParams: Record<string, string | number | null>
  ) => {
    const query = createQueryString(newParams);
    router.push(`${pathname}?${query}`);
  };

  const handlePageChange = (newPage: number) => {
    navigateWithParams({ page: newPage });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, order] = value.split("-");
    navigateWithParams({ sortBy, order, page: 1 }); // Reset page on sort
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateWithParams({ search: searchTerm || null, page: 1, tag: null }); // Reset page and tag on new search
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    router.push(pathname); // Go back to base path, clearing all query params
  };

  // --- Render Logic ---
  const pageTitle = currentTag ? (
    <>
      Questions tagged{" "}
      <Badge
        variant="secondary"
        className="text-lg font-normal align-middle ml-1 px-2.5 py-0.5"
      >
        {currentTag}
      </Badge>
    </>
  ) : currentSearch ? (
    <>
      Search results for{" "}
      <span className="font-semibold text-primary">"{currentSearch}"</span>
    </>
  ) : (
    "All Questions"
  );

  const hasActiveFilters =
    !!currentTag ||
    !!currentSearch ||
    currentSortBy !== "createdAt" ||
    currentOrder !== "desc";

  return (
    <div className="container max-w-5xl mx-auto py-6 px-4 md:px-6">
      <div className="bg-card rounded-lg border shadow-sm p-4 md:p-6 mb-6">
        {" "}
        {/* Reduced padding */}
        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
          <h1 className="text-xl md:text-2xl font-bold">{pageTitle}</h1>
          <Button asChild size="default">
            {" "}
            {/* Link wrapped in Button */}
            <Link
              href="/app/qna/ask"
              className="inline-flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Ask Question</span>
            </Link>
          </Button>
        </div>
        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-3 mb-3">
          {" "}
          {/* Reduced gap/margin */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9" // Smaller height
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              {" "}
              {/* Smaller size */}
              Search
            </Button>
          </form>
          <div className="flex items-center gap-2">
            {/* <Filter className="h-4 w-4 text-muted-foreground" /> */}
            <Select
              value={`${currentSortBy}-${currentOrder}`} // Controlled component
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-auto md:w-[160px] h-9">
                {" "}
                {/* Smaller height */}
                <span className="hidden sm:inline mr-1">Sort by:</span>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Newest</SelectItem>
                <SelectItem value="createdAt-asc">Oldest</SelectItem>
                <SelectItem value="votes-desc">Most Votes</SelectItem>
                <SelectItem value="answers-desc">Most Answers</SelectItem>
                {/* Add more sort options if needed */}
              </SelectContent>
            </Select>
            {/* Clear filters button */}
            {hasActiveFilters && (
              <Button
                onClick={handleClearFilters}
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        {meta && !isLoading && (
          <p className="text-xs text-muted-foreground">
            {meta.total > 0
              ? `Showing ${questions.length} of ${meta.total} ${
                  meta.total === 1 ? "question" : "questions"
                }`
              : "0 questions found"}
          </p>
        )}
        {isLoading && <Skeleton className="h-4 w-32 rounded-md" />}{" "}
        {/* Loading indicator for count */}
      </div>

      {/* Display Loading, Error, or Content */}
      {isLoading ? (
        <QuestionListSkeleton />
      ) : error ? (
        <Card className="border-destructive/50 bg-destructive/5 text-center py-10">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <CardTitle className="text-lg text-destructive mb-2">
            Oops! Something went wrong.
          </CardTitle>
          <CardContent className="pb-0">
            <p className="text-sm text-destructive/90 mb-4">{error}</p>
            <Button
              variant="outline"
              onClick={handleClearFilters} // Use clear filters as retry
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : questions.length > 0 ? (
        <div className="space-y-3">
          {" "}
          {/* Reduced space */}
          {questions.map((question) => (
            <QuestionListItem key={question.id} question={question} />
          ))}
        </div>
      ) : (
        <Card className="bg-muted/30 text-center py-10">
          <CardTitle className="text-lg font-medium mb-2">
            No Questions Found
          </CardTitle>
          <CardContent className="pb-0">
            <p className="text-sm text-muted-foreground mb-4">
              {currentTag
                ? `There are no questions tagged with "${currentTag}" yet.`
                : currentSearch
                ? `Your search for "${currentSearch}" did not match any questions.`
                : "No questions have been asked yet."}
            </p>
            {!currentTag && !currentSearch && (
              <Button asChild variant="default" size="sm">
                <Link href="/app/qna/ask">Be the first to ask!</Link>
              </Button>
            )}
            {(currentTag || currentSearch) && (
              <Button onClick={handleClearFilters} variant="outline" size="sm">
                View All Questions
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination Controls */}
      {meta && meta.totalPages > 1 && !isLoading && (
        <div className="flex justify-center items-center gap-2 mt-6 bg-card rounded-lg border p-3 shadow-sm">
          {" "}
          {/* Reduced gap/margin/padding */}
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page <= 1}
            onClick={() => handlePageChange(meta.page - 1)}
          >
            Previous
          </Button>
          {/* Simplified Pagination Display */}
          <span className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page >= meta.totalPages}
            onClick={() => handlePageChange(meta.page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

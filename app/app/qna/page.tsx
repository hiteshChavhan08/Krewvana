// app/app/qna/page.tsx  <-- Updated path
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp } from "lucide-react";

import { getQuestions, QuestionBasic } from "@/lib/actions/qna"; // Path to actions likely remains the same
import { formatDistanceToNow } from "date-fns";

// Function to safely format dates (keep as before)
function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch (error) {
    console.error("Error formatting date:", date, error);
    return "Invalid date";
  }
}

export default async function QnAPage() {
  // Renamed component function for clarity
  let questionsData: { questions: QuestionBasic[]; total: number } | null =
    null;
  let fetchError: string | null = null;

  try {
    questionsData = await getQuestions();
  } catch (error) {
    console.error("Failed to fetch questions on qna page:", error);
    fetchError =
      error instanceof Error ? error.message : "An unknown error occurred.";
  }

  if (fetchError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Q&A Forum</h1>
        <p className="text-red-600">Error loading questions: {fetchError}</p>
      </div>
    );
  }

  if (!questionsData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Q&A Forum</h1>
        <p>Loading questions...</p>
      </div>
    );
  }

  const { questions, total } = questionsData;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Q&A Forum ({total})</h1>
        {/* --- Link updated to point to the new ask route --- */}
        <Link href="/app/qna/ask" passHref>
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
            Ask Question
          </button>
        </Link>
      </div>

      {questions.length === 0 ? (
        <p>No questions asked yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <Card key={q.id}>
              <CardHeader>
                {/* --- Link updated to point to the new detail route --- */}
                <Link href={`/app/qna/${q.id}`} passHref>
                  <CardTitle className="text-xl hover:text-primary cursor-pointer">
                    {q.title}
                  </CardTitle>
                </Link>
                <CardDescription>
                  Asked by {q.author?.name ?? "Unknown User"}{" "}
                  {formatRelativeDate(q.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2 mt-2">
                  {q.tags.map((questionTag) => (
                    <Badge key={questionTag.tag.id} variant="secondary">
                      {questionTag.tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-start space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{q._count.votes} Votes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{q._count.answers} Answers</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      {/* TODO: Add Pagination Controls Here */}
    </div>
  );
}

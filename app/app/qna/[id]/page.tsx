// app/app/qna/[id]/page.tsx  <-- Updated path
import Link from "next/link"; // Keep Link import if needed for breadcrumbs etc.
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { getQuestionById, QuestionWithDetails } from "@/lib/actions/qna"; // Path likely same
import { AnswerForm } from '@/components/qna/answer-form';

// --- Helper Function (keep as before) ---
function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch (error) {
    console.error("Error formatting date:", date, error);
    return "Invalid date";
  }
}

// --- Component to Render Plate.js Content (Placeholder - keep as before) ---
function RenderContent({ content }: { content: any }) {
  if (!content) return null;
  return (
    <pre className="whitespace-pre-wrap break-words bg-muted p-4 rounded-md text-sm">
      {JSON.stringify(content, null, 2)}
    </pre>
  );
}

// --- Props for the Page Component ---
interface QnADetailPageProps {
  // Renamed interface
  params: {
    id: string;
  };
}

// --- The Page Component ---
export default async function QnADetailPage({ params }: QnADetailPageProps) {
  // Renamed component
  const { id } =  await params;

  let question: QuestionWithDetails | null = null;
  let fetchError: string | null = null;

  try {
    question = await getQuestionById(id);
  } catch (error) {
    console.error(`Failed to fetch question ${id} on qna detail page:`, error);
    fetchError =
      error instanceof Error ? error.message : "An unknown error occurred.";
  }

  if (!question && !fetchError) {
    notFound();
  }

  if (fetchError && !question) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-600">Error loading question: {fetchError}</p>
      </div>
    );
  }

  if (!question) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Optional: Breadcrumbs */}
      <div className="mb-4 text-sm text-muted-foreground">
        <Link href="/app/qna" className="hover:underline">
          Q&A Forum
        </Link>{" "}
        Question
      </div>

      {/* Question Section (content remains the same) */}
      <Card className="mb-8">
        {/* ... CardHeader, CardContent, CardFooter as before ... */}
        <CardHeader>
          <CardTitle className="text-2xl">{question.title}</CardTitle>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={question.author?.image ?? undefined}
                alt={question.author?.name ?? "Author"}
              />
              <AvatarFallback>
                {question.author?.name?.charAt(0).toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <span>{question.author?.name ?? "Unknown User"}</span>
            <span>·</span>
            <span>Asked {formatRelativeDate(question.createdAt)}</span>
            {question.createdAt !== question.updatedAt && (
              <>
                <span>·</span>
                <span className="italic">
                  Edited {formatRelativeDate(question.updatedAt)}
                </span>
              </>
            )}
          </div>
          <div className="flex space-x-2 mt-3">
            {question.tags.map((questionTag) => (
              <Badge key={questionTag.tag.id} variant="secondary">
                {questionTag.tag.name}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <RenderContent content={question.content} />
        </CardContent>
        <CardFooter className="flex justify-start space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <ThumbsUp className="h-4 w-4" />
            <span>{question._count.votes} Votes</span>
          </div>
        </CardFooter>
      </Card>

      {/* Answers Section (content remains the same) */}
      <h2 className="text-2xl font-semibold mb-4">
        {question._count.answers} Answer
        {question._count.answers !== 1 ? "s" : ""}
      </h2>
      {question.answers.length > 0 ? (
        <div className="space-y-6">
          {question.answers.map((answer) => (
            <Card key={answer.id}>
              {/* ... CardHeader, CardContent, CardFooter for answer as before ... */}
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={answer.author?.image ?? undefined}
                      alt={answer.author?.name ?? "Author"}
                    />
                    <AvatarFallback>
                      {answer.author?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{answer.author?.name ?? "Unknown User"}</span>
                  <span>·</span>
                  <span>Answered {formatRelativeDate(answer.createdAt)}</span>
                  {answer.createdAt !== answer.updatedAt && (
                    <>
                      <span>·</span>
                      <span className="italic">
                        Edited {formatRelativeDate(answer.updatedAt)}
                      </span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <RenderContent content={answer.content} />
              </CardContent>
              <CardFooter className="flex justify-start space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{answer._count.votes} Votes</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No answers yet.</p>
      )}

      {/* TODO: Add Answer Form Component Here */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Your Answer</h3>
        <p className="text-muted-foreground">
          {/* [Answer Form Component will be here] */}
          <AnswerForm questionId={question.id} />
        </p>
      </div>
    </div>
  );
}

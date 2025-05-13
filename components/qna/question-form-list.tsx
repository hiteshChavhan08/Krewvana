// components\qna\question-form-list.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { formatDistanceToNowStrict } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MessageSquare, ThumbsUp, CheckCircle, User } from "lucide-react";

// Re-use the type defined in the page component for consistency
type QuestionWithDetails = Prisma.QuestionGetPayload<{
  include: {
    author: { select: { id: true; name: true; image: true } };
    tags: { include: { tag: { select: { name: true; id: true } } } };
    _count: {
      select: {
        answers: true;
        votes: true /* Add comments count if available: comments: true */;
      };
    };
    acceptedAnswer: { select: { id: true } };
  };
}>;

interface QuestionListItemProps {
  question: QuestionWithDetails;
}

export function QuestionListItem({ question }: QuestionListItemProps) {
  const router = useRouter();
  const voteCount = question._count?.votes ?? 0;
  const answerCount = question._count?.answers ?? 0;
  const hasAcceptedAnswer = !!question.acceptedAnswer;
  // const commentCount = question._count?.comments ?? 0; // If you add comment count

  const timeAgo = formatDistanceToNowStrict(new Date(question.createdAt), {
    addSuffix: true,
  });

  const handleTagClick = (
    event: React.MouseEvent<HTMLElement>,
    tagName: string
  ) => {
    event.stopPropagation();
    event.preventDefault();
    router.push(`/app/qna?tag=${encodeURIComponent(tagName)}`);
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg border-muted/60 hover:border-primary/30">
      <CardContent className="p-0">
        {/* Main Link for the Question */}
        <Link href={`/app/qna/${question.id}`} className="block p-4 group">
          {" "}
          {/* Adjusted padding */}
          <div className="flex flex-col gap-2">
            {" "}
            {/* Main content flow */}
            {/* Question Title */}
            <h3 className="text-base sm:text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors leading-snug sm:leading-normal">
              {question.title}
            </h3>
            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {" "}
                {/* Reduced gap */}
                {question.tags.slice(0, 5).map(
                  (
                    { tag } // Limit initial tags
                  ) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="px-2 py-0.5 text-xs cursor-pointer hover:bg-primary/20 transition-colors font-normal" // Smaller padding/text
                      onClick={(e) => handleTagClick(e, tag.name)}
                    >
                      {tag.name}
                    </Badge>
                  )
                )}
                {question.tags.length > 5 && (
                  <Badge
                    variant="outline"
                    className="px-1.5 py-0.5 text-xs font-normal"
                  >
                    +{question.tags.length - 5}
                  </Badge>
                )}
              </div>
            )}
            {/* Footer Row: Stats & Author Info */}
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/50">
              {" "}
              {/* Added top border */}
              {/* Stats Section */}
              <div className="flex items-center gap-3 text-sm">
                {" "}
                {/* Reduced gap */}
                <span
                  className={cn(
                    "flex items-center gap-1",
                    voteCount > 0 ? "text-primary" : "text-muted-foreground"
                  )}
                  title={`${voteCount} votes`} // Tooltip for clarity
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-xs font-medium">{voteCount}</span>{" "}
                  {/* Smaller font */}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1 rounded",
                    hasAcceptedAnswer
                      ? "text-green-600 dark:text-green-400"
                      : answerCount > 0
                      ? "text-primary/90" // Slightly muted primary
                      : "text-muted-foreground"
                  )}
                  title={`${answerCount} answers ${
                    hasAcceptedAnswer ? "(accepted)" : ""
                  }`} // Tooltip
                >
                  {hasAcceptedAnswer ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                  <span className="text-xs font-medium">{answerCount}</span>{" "}
                  {/* Smaller font */}
                </span>
              </div>
              {/* Author & Time Section */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {" "}
                {/* Smaller text/gap */}
                <Avatar className="h-5 w-5 border">
                  {" "}
                  {/* Smaller avatar */}
                  <AvatarImage
                    src={question.author?.image ?? undefined}
                    alt={question.author?.name ?? "User"}
                  />
                  <AvatarFallback className="text-[10px]">
                    {" "}
                    {/* Even smaller fallback text */}
                    {question.author?.name ? (
                      question.author.name.charAt(0).toUpperCase()
                    ) : (
                      <User size={10} />
                    )}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground/90 group-hover:text-primary transition-colors hidden sm:inline truncate max-w-[100px]">
                  {" "}
                  {/* Hide on xs, truncate */}
                  {question.author?.name ?? "Anonymous"}
                </span>
                <span className="hidden sm:inline">•</span> {/* Separator */}
                <span className="whitespace-nowrap">
                  {timeAgo.replace("about ", "")}
                </span>{" "}
                {/* Shorten time string */}
              </div>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}

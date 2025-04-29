// components/qna/QuestionListItem.tsx
import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { formatDistanceToNowStrict } from 'date-fns'; // For relative time

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card'; // Use Card for structure
import { cn } from '@/lib/utils';
import { MessageSquare, ThumbsUp, CheckCircle } from 'lucide-react'; // Icons

// Re-use the type defined in the page component for consistency
type QuestionWithDetails = Prisma.QuestionGetPayload<{
  include: {
    author: { select: { id: true; name: true; image: true } };
    tags: { include: { tag: { select: { name: true; id: true } } } };
    _count: { select: { answers: true; votes: true } };
    acceptedAnswer: { select: { id: true } }; // Check if non-null
  };
}>;

interface QuestionListItemProps {
  question: QuestionWithDetails;
}

export function QuestionListItem({ question }: QuestionListItemProps) {
  const voteCount = question._count?.votes ?? 0; // Default to 0 if count is missing
  const answerCount = question._count?.answers ?? 0;
  const hasAcceptedAnswer = !!question.acceptedAnswer; // Check if an answer is accepted

  // Format creation date (e.g., "5 hours ago", "3 days ago")
  const timeAgo = formatDistanceToNowStrict(new Date(question.createdAt), {
    addSuffix: true,
  });

  return (
    <Card className="hover:bg-muted/50 transition-colors duration-150">
      <CardContent className="p-4 flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Stats Section */}
        <div className="flex sm:flex-col justify-start sm:justify-center items-center gap-x-4 gap-y-1 text-sm text-muted-foreground min-w-[80px] order-2 sm:order-1">
          <div className="flex items-center gap-1 justify-end min-w-[60px]">
            <span className="font-medium text-foreground">{voteCount}</span>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            {/* <span className="hidden sm:inline">votes</span> */}
          </div>
          <div
            className={cn(
              'flex items-center gap-1 justify-end min-w-[60px] p-1 rounded',
              hasAcceptedAnswer
                ? 'text-emerald-600 bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700/50 dark:text-emerald-400' // Highlight if accepted answer exists
                : answerCount > 0
                ? 'text-primary border border-transparent' // Indicate activity if answers exist but none accepted
                : '' // Default if no answers
            )}
          >
            <span className={cn('font-medium', hasAcceptedAnswer || answerCount > 0 ? 'text-inherit' : 'text-foreground')}>{answerCount}</span>
            {hasAcceptedAnswer ? (
                <CheckCircle className="h-4 w-4 text-inherit" />
            ) : (
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
            )}
            {/* <span className="hidden sm:inline">answers</span> */}
          </div>
        </div>

        {/* Main Content Section */}
        <div className="flex-grow space-y-2 order-1 sm:order-2">
          {/* Title */}
          <h2 className="text-lg font-semibold leading-snug hover:text-primary transition-colors">
            <Link href={`/app/qna/${question.id}`} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
              {question.title}
            </Link>
          </h2>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {question.tags.map(({ tag }) => (
              <Link key={tag.id} href={`/questions?tag=${tag.name}`}>
                <Badge variant="secondary" className="hover:bg-primary/10 transition-colors">
                  {tag.name}
                </Badge>
              </Link>
            ))}
          </div>

          {/* Author Info & Timestamp */}
          <div className="flex justify-end items-center pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Avatar className="h-5 w-5">
                <AvatarImage src={question.author?.image ?? undefined} alt={question.author?.name ?? 'User Avatar'} />
                <AvatarFallback className="text-[10px]">
                    {question.author?.name?.charAt(0).toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-foreground font-medium">{question.author?.name ?? 'Unknown User'}</span>
              <span>asked {timeAgo}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
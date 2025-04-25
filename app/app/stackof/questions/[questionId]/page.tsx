// FILE: app/(root)/questions/[questionId]/page.tsx
import { getQuestionById, AnswerWithDetails } from '@/lib/actions/question.actions';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Metric from '@/components/shared/Metric';
import RenderHtml from '@/components/shared/RenderHtml';
import { formatRelativeTime } from '@/lib/utils';
import { ThumbsUp, CheckCircle } from 'lucide-react';
import Link from 'next/link';
// Import AnswerForm later

// --- Answer Card Component (moved to its own file - see components/cards/AnswerCard.tsx) ---
import AnswerCard from '@/components/cards/AnswerCard';


export default async function QuestionDetailPage({ params }: { params: { questionId: string } }) {
  const question = await getQuestionById(params.questionId);

  if (!question) {
    notFound(); // Trigger 404 page if question doesn't exist
  }

  const { title, content, author, tags, createdAt, _count, answers, acceptedAnswerId } = question;

  // TODO: Fetch current user ID here for permission checks later
  // const currentUserId = await getCurrentUserId();

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Question Header */}
      <div className="mb-6 pb-4 border-b">
        <h1 className="text-2xl md:text-3xl font-bold mb-3">{title}</h1>
        <div className="flex justify-between items-center text-sm text-muted-foreground flex-wrap gap-2">
          <Metric
            icon={<Avatar className="h-5 w-5">
                  <AvatarImage src={author.image || '/placeholder.svg?height=20&width=20'} alt={author.name || 'User'} />
                  <AvatarFallback>{author.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>}
            value={author.name || 'Anonymous'}
            title={` • asked ${formatRelativeTime(createdAt)}`}
            href={`/profile/${author.id}`} // Update this link if your profile route is different
            textStyles="font-medium"
            isAuthor
          />
           <Metric
            icon={<ThumbsUp className="h-4 w-4" />}
            value={_count.votes}
            title=" Votes"
            textStyles="text-xs"
          />
           {/* TODO: Add View Count Metric Later */}
        </div>
         <div className="mt-3 flex flex-wrap gap-2">
            {tags.map(({ tag }) => (
            <Link href={`/questions?tag=${tag.name}`} key={tag.id}>
                <Badge variant="secondary">{tag.name}</Badge>
            </Link>
            ))}
        </div>
      </div>

      {/* Question Content */}
      <div className="mb-8">
        {/* SECURITY WARNING: Ensure robust sanitization for production */}
        <RenderHtml htmlString={content} />
      </div>

      {/* TODO: Add Answer Form Component Here */}
      {/* <AnswerForm questionId={question.id} authorId={currentUserId} /> */}
      <div className="mb-8 text-center text-muted-foreground italic">
        (Answer Form Placeholder)
      </div>


      {/* Answers Section */}
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">
          {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
        </h2>
        {answers.map((answer) => (
          <AnswerCard
              key={answer.id}
              answer={answer}
              questionAuthorId={question.authorId}
              // currentUserId={currentUserId} // Pass current user for interactions
          />
        ))}
        {answers.length === 0 && (
           <p className="text-muted-foreground">No answers yet. Be the first to answer!</p>
        )}
      </div>
    </main>
  );
}
// FILE: components/cards/QuestionCard.tsx
import type { QuestionWithDetails } from '@/lib/actions/question.actions';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Metric from '@/components/shared/Metric';
import { formatRelativeTime } from '@/lib/utils';
import { MessageSquare, ThumbsUp, Eye } from 'lucide-react'; // Assuming Eye for views later

interface QuestionCardProps {
  question: QuestionWithDetails;
}

export default function QuestionCard({ question }: QuestionCardProps) {
  const { id, title, author, tags, createdAt, _count } = question;

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 md:p-6 mb-4">
      <div className="flex flex-col-reverse items-start justify-between gap-5 sm:flex-row">
        <div>
          <span className="sm:hidden text-xs text-muted-foreground">
            {formatRelativeTime(createdAt)}
          </span>
          <Link href={`/questions/${id}`}>
            <h3 className="text-lg font-semibold line-clamp-2 hover:text-primary transition-colors">
              {title}
            </h3>
          </Link>
        </div>
        {/* Add link to edit/delete later if needed */}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map(({ tag }) => (
          <Link href={`/questions?tag=${tag.name}`} key={tag.id}>
             <Badge variant="secondary">{tag.name}</Badge>
          </Link>
        ))}
      </div>

      <div className="flex justify-between mt-4 flex-wrap gap-y-2 gap-x-4 items-center text-sm text-muted-foreground">
         <Metric
          icon={<Avatar className="h-5 w-5">
                <AvatarImage src={author.image || '/placeholder.svg?height=20&width=20'} alt={author.name || 'User'} />
                <AvatarFallback>{author.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>}
          value={author.name || 'Anonymous'}
          title={` • asked ${formatRelativeTime(createdAt)}`}
          href={`/profile/${author.id}`} // Link to profile later
          textStyles="font-medium"
          isAuthor
        />
        <div className="flex items-center gap-3">
           <Metric
            icon={<ThumbsUp className="h-4 w-4" />}
            value={_count.votes}
            title={_count.votes === 1 ? ' Vote' : ' Votes'}
            textStyles="text-xs"
          />
          <Metric
            icon={<MessageSquare className="h-4 w-4" />}
            value={_count.answers}
            title={_count.answers === 1 ? ' Answer' : ' Answers'}
            textStyles="text-xs"
          />
          {/* <Metric
            icon={<Eye className="h-4 w-4" />}
            value={12} // Replace with actual view count later
            title=" Views"
            textStyles="text-xs"
          /> */}
        </div>
      </div>
    </div>
  );
}
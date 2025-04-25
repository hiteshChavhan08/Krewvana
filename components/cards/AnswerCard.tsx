// FILE: components/cards/AnswerCard.tsx
import type { AnswerWithDetails } from '@/lib/actions/question.actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button'; // For Accept button later
import Metric from '@/components/shared/Metric';
import RenderHtml from '@/components/shared/RenderHtml';
import { formatRelativeTime } from '@/lib/utils';
import { ThumbsUp, CheckCircle } from 'lucide-react';

interface AnswerCardProps {
    answer: AnswerWithDetails;
    questionAuthorId: string;
    // Pass current user ID later for voting/accepting logic
    currentUserId?: string;
}

export default function AnswerCard({ answer, questionAuthorId, currentUserId }: AnswerCardProps) {
     const { author, content, createdAt, _count, isAccepted } = answer;

     // Determine if the currently viewing user is the author of the *question*
     const isQuestionAuthor = currentUserId === questionAuthorId;
     // Determine if the currently viewing user is the author of this *answer*
     const isAnswerAuthor = currentUserId === answer.authorId;

    return (
        <article className={`border rounded-lg p-4 md:p-6 mb-6 ${isAccepted ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'bg-card'}`}>
             <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                {/* Author and Time */}
                 <Metric
                    icon={<Avatar className="h-5 w-5">
                            <AvatarImage src={author.image || '/placeholder.svg?height=20&width=20'} alt={author.name || 'User'} />
                            <AvatarFallback>{author.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>}
                    value={author.name || 'Anonymous'}
                    title={` • answered ${formatRelativeTime(createdAt)}`}
                    href={`/profile/${author.id}`} // Update profile link if needed
                    textStyles="font-medium text-sm"
                    isAuthor
                />
                {/* Votes and Actions */}
                 <div className="flex items-center gap-3">
                    {isAccepted && (
                         <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
                             <CheckCircle className="h-4 w-4"/> Accepted
                         </div>
                    )}
                    <Metric
                        icon={<ThumbsUp className="h-4 w-4" />}
                        value={_count.votes}
                        title=" Votes"
                        textStyles="text-xs"
                    />
                    {/* TODO: Add Accept Button Action */}
                    {isQuestionAuthor && !isAccepted && (
                        <Button size="sm" variant="outline" disabled> {/* Add onClick handler later */}
                            Accept
                        </Button>
                    )}
                 </div>
             </div>
             {/* Answer Content */}
             {/* SECURITY WARNING: Ensure robust sanitization for production */}
             <RenderHtml htmlString={content} className="mt-2" />

             {/* TODO: Add Edit/Delete controls for answer author */}
             {/* {isAnswerAuthor && (
                <div className="mt-4 flex justify-end gap-2">
                    <Button size="sm" variant="ghost">Edit</Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">Delete</Button>
                </div>
             )} */}
        </article>
    );
}
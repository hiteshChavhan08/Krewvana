// FILE: app/(root)/questions/page.tsx
import { getQuestions } from '@/lib/actions/question.actions';
import QuestionCard from '@/components/cards/QuestionCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
// Import Pagination component later when needed

export default async function QuestionsPage({
    searchParams
}: {
    searchParams?: { [key: string]: string | undefined };
}) {
    // TODO: Implement pagination properly later
    const page = searchParams?.page ? parseInt(searchParams.page, 10) : 1;
    const result = await getQuestions({ page }); // Fetch first page by default

    return (
        <main className="container mx-auto px-4 py-8">
             <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold">All Questions</h1>
                 <Link href="/ask-question">
                    <Button>Ask a Question</Button>
                </Link>
            </div>

            {/* TODO: Add Filters Component here later */}

            <div className="mt-6">
                {result.questions.length > 0 ? (
                    result.questions.map((question) => (
                        <QuestionCard key={question.id} question={question} />
                    ))
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <p>No questions found.</p>
                        <Link href="/ask-question" className="mt-4 inline-block">
                           <Button variant="outline">Be the first to ask!</Button>
                        </Link>
                    </div>
                )}
            </div>

             {/* TODO: Add Pagination Component here later */}
             {/* <div className="mt-10">
                <Pagination totalPages={Math.ceil(result.totalQuestions / 10)} currentPage={page} />
             </div> */}
        </main>
    );
}
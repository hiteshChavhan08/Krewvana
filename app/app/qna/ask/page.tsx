// app/qna/ask/page.tsx
"use client"; // This page needs client-side interactivity for the form

import { QuestionForm } from '@/components/qna/QuestionForm';
import { useSession } from 'next-auth/react'; // Client-side session hook
import { useRouter } from 'next/navigation';

export default function AskQuestionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <div>Loading...</div>; // Or a proper skeleton loader
  }

  if (status === 'unauthenticated') {
    // Redirect or show login prompt
    // router.push('/sign-in'); // Example redirect
    return <div>Please sign in to ask a question.</div>;
  }

  // You might fetch existing tags here to pass to the form for suggestions
  // const [tags, setTags] = useState([]);
  // useEffect(() => { fetch('/api/tags').then(...) }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Ask a Public Question</h1>
      <QuestionForm
        // Pass any necessary props, like existing tags for autocomplete
      />
    </div>
  );
}
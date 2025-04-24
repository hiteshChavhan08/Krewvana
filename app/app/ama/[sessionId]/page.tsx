// app/app/ama/[sessionId]/page.tsx
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth"; // Adjust path
import { prisma } from "@/lib/prisma";       // Adjust path
import AmaSessionClientView from "@/components/ama/ama-session-client-view"; // New client component
import type { CurrentUserData, AMASessionPageData } from "@/types/types"; // Use your defined types
import { toast } from "sonner"; // Or Shadcn <Toaster /> in layout

export default async function AMASessionDetailPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { sessionId } = params;
  if (!sessionId) notFound();

  const [sessionResult, currentUserResult] = await Promise.allSettled([
    prisma.aMASession.findUnique({
      where: { id: sessionId },
      include: {
        host: { select: { id: true, name: true, image: true } },
        _count: { select: { questions: true } },
      },
    }),
    getCurrentUser(),
  ]);

  if (sessionResult.status === 'rejected' || !sessionResult.value) {
      console.error("Failed to fetch AMA session:", sessionResult.status === 'rejected' ? sessionResult.reason : 'Not found');
      notFound();
  }

  if (currentUserResult.status === 'rejected' || !currentUserResult.value) {
      console.error("Failed to fetch current user:", currentUserResult.status === 'rejected' ? currentUserResult.reason : 'Not found');
      redirect(`/api/auth/signin?callbackUrl=/app/ama/${sessionId}`);
  }

  const session: AMASessionPageData = sessionResult.value;
  const fullCurrentUser = currentUserResult.value;

  const currentUserData: CurrentUserData = {
      id: fullCurrentUser.id,
      name: fullCurrentUser.name,
      image: fullCurrentUser.image,
      role: fullCurrentUser.role,
  };

  return (
    // Ensure Toaster is included somewhere in your layout or here
    // <Toaster position="bottom-center" reverseOrder={false} />
    <div className="container mx-auto max-w-4xl py-8 px-4 md:px-0">
      <AmaSessionClientView
        initialSessionData={session}
        currentUserData={currentUserData}
      />
    </div>
  );
}
"use-client"
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// import dynamic from "next/dynamic";
import ClientSessionWrapper from "@/components/ama/client-session-wrapper";


export default async function AMASessionDetailPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { sessionId } = params;

  const [session, currentUser] = await Promise.all([
    prisma.aMASession.findUnique({
      where: { id: sessionId },
      include: {
        host: { select: { id: true, name: true, image: true } },
        _count: { select: { questions: true } },
      },
    }),
    getCurrentUser(),
  ]);

  if (!session) notFound();
  if (!currentUser) redirect(`/api/auth/signin?callbackUrl=/ama/${sessionId}`);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <ClientSessionWrapper
      session={session}
      currentUser={currentUser}
      sessionId={sessionId}
    />
    </div>
  );
}

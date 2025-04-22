// app/app/ama/[sessionId]/page.tsx
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma"; // Direct DB access for RSC
import { getCurrentUser } from "@/lib/auth";
import { AMASessionStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Mic, HelpCircle, AlertCircle } from "lucide-react";
import {
  getInitials,
  getAMAStatusBadgeVariant,
  getAMAStatusText,
} from "@/lib/utils/helpers"; // Use shared helpers
import { formatDateTime } from "@/lib/utils/date-helpers"; // Use shared helper
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Import Client Components (we will create these next)
import { QuestionSubmitForm } from "@/components/question-submit-form";
import { QuestionList } from "@/components/question-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SessionStatusActions } from "@/components/ama/session-status-actions";

// --- Define Session Detail Type (more comprehensive than list view) ---
// This should align with the data returned by the GET /api/ama/sessions/[sessionId] endpoint
type AMASessionDetail = {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: Date | string;
  status: AMASessionStatus;
  isTechSpecific: boolean;
  topic: string | null;
  createdAt: Date | string;
  host: {
    id: string;
    name: string | null;
    image: string | null;
  };
  // We might fetch questions separately, but keep count if available
  _count?: { questions?: number };
};


// --- Data Fetching Function ---
async function getSessionDetails(
  sessionId: string
): Promise<AMASessionDetail | null> {
  if (!sessionId) return null;
  try {
    // Fetch directly from DB OR use API: fetch(`/api/ama/sessions/${sessionId}`)
    const session = await prisma.aMASession.findUnique({
      where: { id: sessionId },
      include: {
        host: { select: { id: true, name: true, image: true } },
        // _count: { select: { questions: true } } // Count can be fetched if needed
      },
    });
    return session;
  } catch (error) {
    console.error("Error fetching session details:", error);
    return null; // Return null on error
  }
}

// --- Loading Skeleton ---
function SessionDetailSkeleton() {
  return (
    <div className="container mx-auto max-w-3xl py-8 px-4 md:px-6 lg:px-8 space-y-6">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-8 w-4/5 mb-3" /> {/* Title */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
          <Skeleton className="h-6 w-20" /> {/* Status Badge */}
          <Skeleton className="h-5 w-48" /> {/* Date/Time */}
        </div>
        <div className="flex items-center mb-4">
          <Skeleton className="h-10 w-10 rounded-full mr-3" />{" "}
          {/* Host Avatar */}
          <Skeleton className="h-6 w-40" /> {/* Host Name */}
        </div>
        <Skeleton className="h-5 w-full mt-1" /> {/* Description Line 1 */}
        <Skeleton className="h-5 w-11/12 mt-1" /> {/* Description Line 2 */}
      </div>
      <Separator />
      {/* Question Submit Skeleton */}
      <div>
        <Skeleton className="h-7 w-40 mb-4" /> {/* Submit Title */}
        <Skeleton className="h-24 w-full mb-2" /> {/* Text Area */}
        <Skeleton className="h-10 w-28" /> {/* Submit Button */}
      </div>
      <Separator />
      {/* Question List Skeleton */}
      <div>
        <Skeleton className="h-7 w-40 mb-4" /> {/* List Title */}
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}

// --- Main Page Component ---
export default async function AMASessionDetailPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { sessionId } = await params;
  const [session, currentUser] = await Promise.all([
    getSessionDetails(sessionId),
    getCurrentUser(),
  ]);

  // Handle session not found
  if (!session) {
    notFound();
  }

  // Redirect if user not logged in (needed for submitting questions)
  if (!currentUser) {
    redirect(`/api/auth/signin?callbackUrl=/ama/${sessionId}`);
  }

  const canSubmitQuestions =
    session.status === AMASessionStatus.UPCOMING ||
    session.status === AMASessionStatus.LIVE;
  const isHost = currentUser.id === session.host.id;
  const isAdmin = false; // Placeholder
  const canManage = isHost || isAdmin;
  return (
    <Suspense fallback={<SessionDetailSkeleton />}>
      <div className="container mx-auto max-w-3xl py-8 px-4 md:px-6 lg:px-8">
        {" "}
        {/* Constrain width */}
        {/* --- Header Section --- */}
        <section className="mb-6">
          <h1 className="text-3xl font-bold leading-tight mb-2">
            {session.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
            <Badge
              variant={getAMAStatusBadgeVariant(session.status)}
              className={`capitalize text-xs inline-flex items-center whitespace-nowrap
                             ${
                               session.status === AMASessionStatus.LIVE
                                 ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700/50"
                                 : ""
                             }
                             ${
                               session.status === AMASessionStatus.UPCOMING
                                 ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-700/50"
                                 : ""
                             }
                         `}
            >
              {/* TODO: Add specific icon for status? */}
              {getAMAStatusText(session.status)}
            </Badge>
            <div className="inline-flex items-center">
              {" "}
              <Calendar className="h-4 w-4 mr-1.5" />{" "}
              {formatDateTime(session.scheduledAt)}{" "}
            </div>
          </div>
          {/* Host Info */}
          <div className="flex items-center mb-4">
            <span className="text-sm text-muted-foreground mr-2">
              Hosted by:
            </span>
            <Avatar className="h-8 w-8 mr-2">
              {" "}
              <AvatarImage src={session.host.image ?? undefined} />{" "}
              <AvatarFallback>{getInitials(session.host.name)}</AvatarFallback>{" "}
            </Avatar>
            <span className="font-medium">{session.host.name ?? "Host"}</span>
            {isHost && (
              <Badge variant="secondary" className="ml-2 text-xs">
                You
              </Badge>
            )}
          </div>
          {/* Description */}
          {session.description && (
            <p className="text-base text-foreground/80">
              {session.description}
            </p>
          )}
          {/* --- Session Status Controls --- */}
          {canManage && (
            <div className="mt-4 pt-4 border-t border-dashed">
              <SessionStatusActions
                sessionId={session.id}
                currentStatus={session.status}
              />
            </div>
          )}
          {/* TODO: Add Admin/Host controls here later (e.g., Start/End Session) */}
        </section>
        <Separator className="my-6 md:my-8" />
        {/* --- Question Submission Section --- */}
        {canSubmitQuestions && (
          <section className="mb-6 md:mb-8">
            <h2 className="text-xl font-semibold mb-4">Ask a Question</h2>
            <QuestionSubmitForm sessionId={sessionId} />
          </section>
        )}
        {!canSubmitQuestions &&
          session.status !== AMASessionStatus.CANCELLED && (
            <Alert className="mb-6 md:mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Question submission is closed for this session as it has ended.
              </AlertDescription>
            </Alert>
          )}
        {/* --- Question List Section --- */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Questions</h2>
          <QuestionList
            sessionId={sessionId}
            isHostOrAdmin={isHost || isAdmin}
          />
        </section>
      </div>
    </Suspense>
  );
}

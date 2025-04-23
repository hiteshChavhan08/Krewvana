import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { AMASessionStatus } from "@prisma/client"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, MessageSquare } from "lucide-react"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

// Import Client Components
import { QuestionSubmitForm } from "@/components/ama/question-submit-form"
import { QuestionList } from "@/components/ama/question-list"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SessionStatusActions } from "@/components/ama/session-status-actions"
import { SessionHeader } from "@/components/ama/session-header"

// --- Define Session Detail Type ---
type AMASessionDetail = {
  id: string
  title: string
  description: string | null
  scheduledAt: Date | string
  status: AMASessionStatus
  isTechSpecific: boolean
  topic: string | null
  createdAt: Date | string
  host: {
    id: string
    name: string | null
    image: string | null
  }
  _count?: { questions?: number }
}

// --- Data Fetching Function ---
async function getSessionDetails(sessionId: string): Promise<AMASessionDetail | null> {
  if (!sessionId) return null
  try {
    const session = await prisma.aMASession.findUnique({
      where: { id: sessionId },
      include: {
        host: { select: { id: true, name: true, image: true } },
      },
    })
    return session
  } catch (error) {
    console.error("Error fetching session details:", error)
    return null
  }
}

// --- Loading Skeleton ---
function SessionDetailSkeleton() {
  return (
    <div className="container mx-auto max-w-3xl py-8 px-4 md:px-6 lg:px-8 space-y-6">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-8 w-4/5 mb-3" />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex items-center mb-4">
          <Skeleton className="h-10 w-10 rounded-full mr-3" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-5 w-full mt-1" />
        <Skeleton className="h-5 w-11/12 mt-1" />
      </div>
      <Separator />
      {/* Question Submit Skeleton */}
      <div>
        <Skeleton className="h-7 w-40 mb-4" />
        <Skeleton className="h-24 w-full mb-2" />
        <Skeleton className="h-10 w-28" />
      </div>
      <Separator />
      {/* Question List Skeleton */}
      <div>
        <Skeleton className="h-7 w-40 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  )
}

// --- Main Page Component ---
export default async function AMASessionDetailPage({
  params,
}: {
  params: { sessionId: string }
}) {
  const { sessionId } = await params
  const [session, currentUser] = await Promise.all([getSessionDetails(sessionId), getCurrentUser()])

  // Handle session not found
  if (!session) {
    notFound()
  }

  // Redirect if user not logged in (needed for submitting questions)
  if (!currentUser) {
    redirect(`/api/auth/signin?callbackUrl=/ama/${sessionId}`)
  }

  const canSubmitQuestions = session.status === AMASessionStatus.UPCOMING || session.status === AMASessionStatus.LIVE
  const isHost = currentUser.id === session.host.id
  const isAdmin = false // Placeholder
  const canManage = isHost || isAdmin

  return (
    <Suspense fallback={<SessionDetailSkeleton />}>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-3xl py-8 px-4 md:px-6 lg:px-8">
          {/* --- Header Section --- */}
          <section className="bg-background rounded-lg p-6 shadow-sm border">
            <SessionHeader session={session} isHost={isHost} />

            {/* --- Session Status Controls --- */}
            {canManage && (
              <div className="mt-4 pt-4 border-t border-dashed">
                <SessionStatusActions sessionId={session.id} currentStatus={session.status} />
              </div>
            )}
          </section>

          <div className="my-6 md:my-8"></div>

          {/* --- Question Submission Section --- */}
          {canSubmitQuestions && (
            <section className="mb-6 md:mb-8 bg-background rounded-lg p-6 shadow-sm border">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="bg-primary/10 text-primary p-1.5 rounded-md mr-2">
                  <AlertCircle className="h-5 w-5" />
                </span>
                Ask a Question
              </h2>
              <QuestionSubmitForm sessionId={sessionId} />
            </section>
          )}

          {!canSubmitQuestions && session.status !== AMASessionStatus.CANCELLED && (
            <Alert className="mb-6 md:mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Question submission is closed for this session as it has ended.</AlertDescription>
            </Alert>
          )}

          {/* --- Question List Section --- */}
          <section className="bg-background rounded-lg p-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <span className="bg-primary/10 text-primary p-1.5 rounded-md mr-2">
                <MessageSquare className="h-5 w-5" />
              </span>
              Questions
            </h2>
            <QuestionList sessionId={sessionId} isHostOrAdmin={isHost || isAdmin} />
          </section>
        </div>
      </div>
    </Suspense>
  )
}

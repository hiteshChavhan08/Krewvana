// src/components/ama-session/ama-session-client-view.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import type {
  AMASessionPageData,
  CurrentUserData,
  AMAQuestionData,
} from "@/types/types"; // Use your defined types
import { UserRole, AMASessionStatus } from "@prisma/client";
import { canSubmitQuestions } from "@/lib/utils/ama-utils"; // Use your defined utils
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// Import new component names
import { AmaSessionDisplayHeader } from "@/components/ama/ama-session-display-header";
import { AmaAdminControls } from "@/components/ama/ama-admin-controls";
import { AmaQuestionInput } from "@/components/ama/ama-question-input";
import { AmaQuestionFeed } from "@/components/ama//ama-question-feed";
// Consider adding Magic UI patterns or Aceternity background here if desired
// import DotPattern from "@/components/magicui/dot-pattern"; // Example

interface AmaSessionClientViewProps {
  initialSessionData: AMASessionPageData;
  currentUserData: CurrentUserData;
}

export default function AmaSessionClientView({
  initialSessionData,
  currentUserData,
}: AmaSessionClientViewProps) {
  const [session, setSession] =
    useState<AMASessionPageData>(initialSessionData);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // State to trigger question refetch

  const isHost = currentUserData?.id === session?.host?.id;
  const isAdmin = currentUserData?.role === UserRole.ADMIN;
  const canManageSession = isHost || isAdmin;
  const showQuestionForm = canSubmitQuestions(session.status);
  const sessionId = session.id;

  // Callback to update session state, e.g., after status change
  const handleSessionUpdate = useCallback(
    (updatedData: Partial<AMASessionPageData>) => {
      setSession((prev) => ({ ...prev, ...updatedData }));
      toast.success(`Session status updated to ${updatedData.status}!`);
      setRefreshTrigger((prev) => prev + 1); // Refresh questions on status change too
    },
    []
  );

  // Callback for when a question is submitted successfully
  const handleQuestionSubmitted = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1); // Increment trigger to refetch questions
  }, []);


  if (!session || !currentUserData) {
    return <SessionLoadingSkeleton />; // Show loading state
  }

  return (
    <div className="relative space-y-8">
      {/* Optional Background Pattern from Magic UI */}
      {/* <DotPattern className="absolute -z-10 [mask-image:radial-gradient(circle_at_center,white,transparent_80%)]" /> */}

      {/* 1. Session Header */}
      <AmaSessionDisplayHeader session={session} />

      {/* 2. Host/Admin Controls */}
      {canManageSession && (
        <AmaAdminControls
          sessionId={sessionId}
          currentStatus={session.status}
          onStatusChange={handleSessionUpdate} // Pass callback
        />
      )}

      {/* 3. Question Submission Form */}
      {showQuestionForm && (
        <AmaQuestionInput
          sessionId={sessionId}
          onQuestionSubmitted={handleQuestionSubmitted} // Pass callback
        />
      )}

      {/* 4. Question Feed */}
      <AmaQuestionFeed
        sessionId={sessionId}
        sessionStatus={session.status}
        currentUser={currentUserData}
        isHostOrAdmin={canManageSession}
        refreshTrigger={refreshTrigger} // Pass trigger state
      />
    </div>
  );
}

// Simple skeleton loader for the whole session view
const SessionLoadingSkeleton = () => (
  <div className="space-y-8">
    <Skeleton className="h-24 w-full" /> {/* Header area */}
    <Skeleton className="h-10 w-48" /> {/* Admin controls area */}
    <Skeleton className="h-32 w-full" /> {/* Input area */}
    <div className="space-y-4">
      {" "}
      {/* Question list area */}
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  </div>
);

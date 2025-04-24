"use client";

import { SessionHeader } from "@/components/ama/session-header";
import { SessionStatusActions } from "@/components/ama/session-status-actions";
import { QuestionList } from "@/components/ama/question-list";
import { QuestionSubmitForm } from "@/components/ama/question-submit-form";
import { canSubmitQuestions } from "@/lib/utils/ama-utils";
import { AMASessionStatus, UserRole } from "@prisma/client";

type Props = {
  session: {
    id: string;
    status: AMASessionStatus;
    host: {
      id: string;

      name: string | null;
      image: string | null;
    };

    title: string;
    description: string | null;
    scheduledAt: string | Date;
  };
  currentUser: {
    id: string;
    role: string;
    // ... other user properties (e.g., roles)
  };
  sessionId: string;
};

const SessionUIWrapper = ({ session, currentUser, sessionId }: Props) => {
  // Check for essential props right away
  if (!session || !currentUser) {
    return <div>Loading session data... (Error: Missing props)</div>;
  }

  const isHost = currentUser?.id === session?.host?.id;
  // Ensure role comparison is safe
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const canManage = isHost || isAdmin;
  const allowQuestionSubmission = canSubmitQuestions(session.status);

  
  
  return (
    
    <div className="space-y-6">
      <SessionHeader session={session} isHost={isHost} />
      {canManage && (
        <SessionStatusActions
          sessionId={session.id}
          currentStatus={session.status}
        />
      )}
      {allowQuestionSubmission && <QuestionSubmitForm sessionId={sessionId} />}
      <QuestionList
        sessionId={sessionId}
        isHostOrAdmin={canManage}
        sessionStatus={session.status}
      />
    </div>
  );
};

export default SessionUIWrapper;

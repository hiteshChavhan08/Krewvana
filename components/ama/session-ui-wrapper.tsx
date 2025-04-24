"use client";

import { SessionHeader } from "@/components/ama/session-header";
import { SessionStatusActions } from "@/components/ama/session-status-actions";
import { QuestionList } from "@/components/ama/question-list";
import { QuestionSubmitForm } from "@/components/ama/question-submit-form";
import { canSubmitQuestions } from "@/lib/utils/ama-utils";

type Props = {
  session: any;        // Replace `any` with `AMASessionDetail` if you have it
  currentUser: any;    // Replace `any` with your user type if available
  sessionId: string;
};

const SessionUIWrapper = ({ session, currentUser, sessionId }: Props) =>{
  const isHost = currentUser.id === session.host.id;
  const isAdmin = false;
  const canManage = isHost || isAdmin;
  const allowQuestionSubmission = canSubmitQuestions(session.status);

  return (
    <>
      <SessionHeader session={session} isHost={isHost} />
      {canManage && (
        <SessionStatusActions
          sessionId={session.id}
          currentStatus={session.status}
        />
      )}
      {allowQuestionSubmission && <QuestionSubmitForm sessionId={sessionId} />}
      <QuestionList sessionId={sessionId} isHostOrAdmin={isHost || isAdmin} />
    </>
  );
}

export default SessionUIWrapper;

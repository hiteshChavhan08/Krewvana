// services/amaService.ts (NEW FILE or add to existing service layer)
// Separates DB logic and business rules from API route handlers
import { prisma } from "@/lib/prisma";
import { AMASessionStatus, UserRole } from "@prisma/client";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/api/responses"; // Import custom errors
import { ApiError } from "next/dist/server/api-utils";
import { z } from "zod";

interface AuthenticatedUser {
  // Use the augmented User type if available
  id: string;
  role?: UserRole | null; // Assuming role is added to session user
  // Add other fields from session user if needed
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface ListSessionsParams extends PaginationParams {
  status?: AMASessionStatus | null;
}

interface ListSessionQuestionsParams extends PaginationParams {
  sessionId: string;
  filter?: {
    approved?: boolean | null; // true, false, or null (don't filter by approved status)
    answered?: boolean | null; // true, false, or null (don't filter by answered status)
    mine?: boolean | null; // true (show only mine), false/null (show based on other criteria)
  };
  requestingUser: AuthenticatedUser | null; // User making the request
}

/**
 * Checks if the user is authorized to moderate (approve/answer/delete) a specific AMA question.
 * Throws ForbiddenError if not authorized.
 * Throws NotFoundError if the question or related session doesn't exist.
 * Fetches necessary data efficiently.
 * @param user - The authenticated user object from the session.
 * @param questionId - The ID of the question to moderate.
 */
export const authorizeAmaQuestionModeration = async (
  user: AuthenticatedUser,
  questionId: string
): Promise<void> => {
  if (!user?.id || user.role === undefined) {
    throw new ForbiddenError("User information incomplete for authorization.");
  }

  try {
    const question = await prisma.aMAQuestion.findUnique({
      where: { id: questionId },
      select: {
        session: { select: { hostId: true } }, // Only need hostId from session
      },
    });

    if (!question?.session) {
      throw new NotFoundError("AMA Question or associated Session");
    }

    const isHost = question.session.hostId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isHost && !isAdmin) {
      throw new ForbiddenError(
        "You do not have permission to moderate this question."
      );
    }
    // Authorized
  } catch (error) {
    if (error instanceof ApiError) throw error; // Re-throw known API errors
    console.error("Error during AMA question authorization:", error);
    throw new Error("Failed to verify authorization."); // Generic internal error
  }
};

/**
 * Updates an AMA Question (approval, answer text).
 * Includes authorization check internally.
 * @param questionId - ID of the question to update.
 * @param data - Validated update data (isApproved, answerText).
 * @param moderator - The user performing the update.
 * @returns The updated and potentially anonymized question data.
 */
export const updateAmaQuestion = async (
  questionId: string,
  data: { isApproved?: boolean; answerText?: string }, // This is the input data shape
  moderator: AuthenticatedUser
) => {
  // Authorization is checked first
  await authorizeAmaQuestionModeration(moderator, questionId);

  // Prepare the data payload for Prisma update
  let updateData: {
    isApproved?: boolean;
    answerText?: string | null;
    answeredById?: string | null;
    answeredAt?: Date | null;
  } = {};

  if (data.isApproved !== undefined) {
    updateData.isApproved = data.isApproved;
  }

  // Handle answerText update logic
  if (data.answerText !== undefined) {
    const trimmedAnswer = data.answerText.trim();
    updateData.answerText = trimmedAnswer || null; // Set to null if empty after trim
    updateData.answeredById = trimmedAnswer ? moderator.id : null;
    updateData.answeredAt = trimmedAnswer ? new Date() : null;

    // Answering implies approval if approval status is not being explicitly set otherwise in this request
    if (trimmedAnswer && data.isApproved === undefined) {
      updateData.isApproved = true;
    }
    // If explicitly clearing the answer text, should we also clear approval? Decide business logic.
    // Example: If you want clearing the answer to make it unapproved:
    // if (!trimmedAnswer) {
    //   updateData.isApproved = false; // Or keep existing approval status?
    // }
  }

  if (Object.keys(updateData).length === 0) {
    // Ensure at least one field is being updated
    throw new BadRequestError(
      "No update fields provided (isApproved or answerText)"
    );
  }

  // Perform the update
  const updatedQuestion = await prisma.aMAQuestion.update({
    where: { id: questionId },
    data: updateData,
    include: {
      // Include relations needed by the frontend
      submittedBy: { select: { id: true, name: true, image: true } },
      answeredBy: { select: { id: true, name: true, image: true } },
    },
  });

  // Anonymize submitter details in the response if the question was originally anonymous
  // We need the original isAnonymous flag for this, so fetch it if not already available
  // NOTE: This logic might be better placed AFTER fetching if not included,
  // or assume updatedQuestion includes the isAnonymous flag. Let's assume it does for simplicity.
  const responseData = {
    ...updatedQuestion,
    // Ensure updatedQuestion includes the isAnonymous field from the DB
    submittedBy: updatedQuestion.isAnonymous
      ? null
      : updatedQuestion.submittedBy,
    submittedById: updatedQuestion.isAnonymous
      ? null
      : updatedQuestion.submittedById,
  };

  // TODO: Trigger notification for submitter about update/answer?

  return responseData;
};

/**
 * Deletes an AMA Question.
 * Includes authorization check internally.
 * @param questionId - ID of the question to delete.
 * @param moderator - The user performing the deletion.
 */
export const deleteAmaQuestion = async (
  questionId: string,
  moderator: AuthenticatedUser
) => {
  // Authorization is checked first
  await authorizeAmaQuestionModeration(moderator, questionId);

  // Perform the deletion
  await prisma.aMAQuestion.delete({
    where: { id: questionId },
  });

  // TODO: Trigger notification for submitter? (Maybe not for deletion)
  // No return value needed for successful deletion (caller handles 204 response)
};

/**
 * Adds or updates the answer for a specific AMA Question.
 * Includes authorization check internally.
 * @param questionId - ID of the question to answer.
 * @param answerText - The validated answer text (non-empty).
 * @param moderator - The user submitting the answer (must have id and role).
 * @returns The updated question data with included relations, anonymized if necessary.
 * @throws NotFoundError if question or associated session not found.
 * @throws ForbiddenError if user is not authorized.
 */
export const answerAmaQuestion = async (
  questionId: string,
  answerText: string, // Should be validated (non-empty) before calling
  moderator: AuthenticatedUser
) => {
  if (!moderator?.id || moderator.role === undefined) {
    throw new ForbiddenError(
      "User information is incomplete for authorization."
    );
  }

  // Fetch question context needed for auth check AND anonymization
  const question = await prisma.aMAQuestion.findUnique({
    where: { id: questionId },
    select: {
      isAnonymous: true, // Needed for response anonymization
      session: { select: { hostId: true } }, // Needed for authorization
    },
  });

  // Ensure question and its session context exist
  if (!question?.session) {
    throw new NotFoundError("AMA Question or associated Session");
  }

  // Authorization check
  const isHost = question.session.hostId === moderator.id;
  const isAdmin = moderator.role === UserRole.ADMIN;

  if (!isHost && !isAdmin) {
    throw new ForbiddenError(
      "You do not have permission to answer this question."
    );
  }

  // Perform the database update
  const updatedQuestion = await prisma.aMAQuestion.update({
    where: { id: questionId },
    data: {
      answerText: answerText, // Use the validated text
      answeredAt: new Date(),
      answeredById: moderator.id,
    },
    include: {
      // Include data needed by frontend
      submittedBy: { select: { id: true, name: true, image: true } },
      answeredBy: { select: { id: true, name: true, image: true } },
    },
  });

  // Anonymize submitter details in the response if the question was originally anonymous
  // Use the 'isAnonymous' flag fetched earlier
  const responseData = {
    ...updatedQuestion,
    submittedBy: question.isAnonymous ? null : updatedQuestion.submittedBy,
    submittedById: question.isAnonymous ? null : updatedQuestion.submittedById,
  };

  return responseData;
};
// Helper function to check moderation rights for a SESSION (not just a question)
// Can be combined/refactored with authorizeAmaQuestionModeration if overlap is significant
const isSessionModerator = async (
  userId: string | undefined,
  sessionId: string
): Promise<boolean> => {
  if (!userId) return false;
  try {
    const session = await prisma.aMASession.findUnique({
      where: { id: sessionId },
      select: { hostId: true },
    });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!session || !user) return false;

    return session.hostId === userId || user.role === UserRole.ADMIN;
  } catch {
    return false;
  }
};

/**
 * Lists AMA Sessions with filtering and pagination.
 */
export const listAmaSessions = async (params: ListSessionsParams) => {
  const { status, page = 1, limit = 10 } = params;

  let whereClause: any = {};
  if (status && Object.values(AMASessionStatus).includes(status)) {
    whereClause.status = status;
  }

  const skip = (page - 1) * limit;

  const [sessions, totalCount] = await Promise.all([
    prisma.aMASession.findMany({
      where: whereClause,
      include: {
        host: { select: { id: true, name: true, image: true } },
        _count: {
          // Count ALL related questions
          select: { questions: true }, // Remove the 'where' clause here
        }, // Count approved questions
      },
      orderBy: {
        scheduledAt: status === AMASessionStatus.UPCOMING ? "asc" : "desc",
      },
      take: limit,
      skip: skip,
    }),
    prisma.aMASession.count({ where: whereClause }),
  ]);

  return {
    data: sessions,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

/**
 * Creates a new AMA Session (Admin only).
 */
export const createAmaSession = async (
  data: z.infer<typeof createSessionSchema>, // Use the Zod schema type
  creator: AuthenticatedUser // User performing the action
) => {
  // Authorization (re-check here, belt-and-suspenders)
  if (creator.role !== UserRole.ADMIN) {
    throw new ForbiddenError("Only admins can create AMA sessions.");
  }

  // Verify host exists
  const hostExists = await prisma.user.findUnique({
    where: { id: data.hostId },
    select: { id: true },
  });
  if (!hostExists) {
    throw new BadRequestError("Selected host user not found.", [
      { path: ["hostId"], message: "Selected host user not found." } as any,
    ]);
  }

  const newSession = await prisma.aMASession.create({
    data: {
      title: data.title,
      description: data.description,
      scheduledAt: data.scheduledAt,
      hostId: data.hostId,
      isTechSpecific: data.isTechSpecific,
      topic: data.isTechSpecific ? data.topic : null,
      status: AMASessionStatus.UPCOMING,
    },
    include: {
      host: { select: { id: true, name: true, image: true } },
    },
  });

  // TODO: Notify host

  return newSession;
};

/**
 * Lists questions for a specific AMA session with filtering and anonymization.
 */
export const listAmaSessionQuestions = async (
  params: ListSessionQuestionsParams
) => {
  const { sessionId, filter = {}, requestingUser } = params;
  // TODO: Implement pagination if needed (page, limit)

  let whereClause: any = { sessionId: sessionId };

  const canModerate = requestingUser
    ? await isSessionModerator(requestingUser.id, sessionId)
    : false;

  if (filter.mine && requestingUser) {
    // If 'mine' filter is active, override other filters for this user
    whereClause.submittedById = requestingUser.id;
    // Optionally, moderators might still want to see *all* their own questions regardless of approval
    // if (!canModerate) {
    //     whereClause.isApproved = true; // Regular users only see their approved 'mine' questions
    // }
  } else {
    // Regular filtering logic
    if (canModerate) {
      // Moderators can filter by approval status
      if (filter.approved === true) whereClause.isApproved = true;
      if (filter.approved === false) whereClause.isApproved = false;
      // If approved filter is null/undefined, moderator sees all approval statuses
    } else {
      // Regular users OR anonymous users ALWAYS see only approved questions
      whereClause.isApproved = true;
    }

    // Filtering by answered status (applies within the approval scope)
    if (filter.answered === true) whereClause.answerText = { not: null };
    if (filter.answered === false) whereClause.answerText = null;
  }

  const questions = await prisma.aMAQuestion.findMany({
    where: whereClause,
    include: {
      submittedBy: { select: { id: true, name: true, image: true } },
      answeredBy: { select: { id: true, name: true, image: true } },
    },
    orderBy: [
      // Prioritize unanswered questions for moderators if they aren't filtering specifically for answered
      canModerate && filter.answered !== true ? { isApproved: "asc" } : null, // Pending first for moderators
      canModerate && filter.answered !== true ? { answerText: "asc" } : null, // Unanswered before answered
      { createdAt: "asc" }, // Oldest first generally
    ].filter(Boolean) as any[], // Remove nulls from orderBy array
    // Add take/skip for pagination later
  });

  // Anonymize Data
  const processedQuestions = questions.map((q) => ({
    ...q,
    submittedBy: q.isAnonymous ? null : q.submittedBy,
    submittedById: q.isAnonymous ? null : q.submittedById,
  }));

  return processedQuestions;
  // Return pagination info if implemented
};

/**
 * Submits a question to an AMA session.
 */
export const submitAmaQuestion = async (
  sessionId: string,
  data: z.infer<typeof submitQuestionSchema>, // Use Zod schema type
  submitter: AuthenticatedUser
) => {
  if (!submitter?.id) throw new ForbiddenError("Authentication required."); // Defensive

  // Check session status
  const session = await prisma.aMASession.findUnique({
    where: { id: sessionId },
    select: { status: true },
  });
  if (!session) {
    throw new NotFoundError("AMA Session");
  }
  if (
    session.status !== AMASessionStatus.UPCOMING &&
    session.status !== AMASessionStatus.LIVE
  ) {
    throw new BadRequestError(
      `Cannot submit questions for a session that is ${session.status.toLowerCase()}`
    );
  }

  const newQuestion = await prisma.aMAQuestion.create({
    data: {
      text: data.text,
      isAnonymous: data.isAnonymous,
      sessionId: sessionId,
      submittedById: submitter.id,
      // isApproved: false, // Default to not approved
    },
    select: {
      // Select fields for response
      id: true,
      text: true,
      isAnonymous: true,
      createdAt: true,
      submittedBy: { select: { id: true, name: true, image: true } },
    },
  });

  // Anonymize response if needed
  const responseData = {
    ...newQuestion,
    submittedBy: newQuestion.isAnonymous ? null : newQuestion.submittedBy,
  };

  // TODO: Notify host/admin

  return responseData;
};

// --- Zod Schemas (Defined only once, maybe move to a common types/schemas file later) ---
export const createSessionSchema = z
  .object({
    // Export if needed elsewhere
    title: z.string().min(5, "Title must be at least 5 characters").max(150),
    description: z.string().max(1000).optional(),
    scheduledAt: z.coerce
      .date({
        errorMap: (issue, { defaultError }) => ({
          message:
            issue.code === "invalid_date"
              ? "Please enter a valid date and time"
              : defaultError,
        }),
      })
      .min(new Date(), { message: "Scheduled date must be in the future" }),
    hostId: z.string().cuid({ message: "Invalid Host User ID" }),
    isTechSpecific: z.boolean().optional().default(false),
    topic: z.string().max(50).optional(),
  })
  .refine(
    (data) =>
      !data.isTechSpecific ||
      (data.isTechSpecific && data.topic && data.topic.trim().length > 0),
    {
      message: "A topic is required for tech-specific AMAs",
      path: ["topic"],
    }
  );

export const submitQuestionSchema = z
  .object({
    // Export if needed elsewhere
    text: z
      .string()
      .min(10, "Question must be at least 10 characters")
      .max(1000),
    isAnonymous: z.boolean().optional().default(false),
  })
  .strict();

/**
 * Checks if the user is authorized to manage (update status) a specific AMA session.
 * Throws ForbiddenError if not authorized (Host or Admin).
 * Throws NotFoundError if the session or user doesn't exist.
 * @param user - The authenticated user object from the session (must include id and role).
 * @param sessionId - The ID of the session to manage.
 */
export const authorizeSessionManagement = async (
  user: AuthenticatedUser,
  sessionId: string
): Promise<void> => {
  if (!user?.id || user.role === undefined) {
    throw new ForbiddenError("User information incomplete for authorization.");
  }

  try {
    const session = await prisma.aMASession.findUnique({
      where: { id: sessionId },
      select: { hostId: true }, // Only need hostId
    });

    if (!session) {
      throw new NotFoundError("AMA Session");
    }

    // Role check is implicit via user.role from AuthenticatedUser type
    const isHost = session.hostId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isHost && !isAdmin) {
      throw new ForbiddenError(
        "You do not have permission to manage this session."
      );
    }
    // Authorized if reached here
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("Error during session management authorization:", error);
    throw new Error("Failed to verify session management authorization.");
  }
};

/**
 * Fetches a single AMA Session by its ID.
 * @param sessionId - The ID of the session to fetch.
 * @returns The session data including host and question count.
 * @throws NotFoundError if the session doesn't exist.
 */
export const getAmaSessionById = async (sessionId: string) => {
  const session = await prisma.aMASession.findUnique({
    where: { id: sessionId },
    include: {
      host: { select: { id: true, name: true, image: true } },
      _count: { select: { questions: true } }, // Count all questions
    },
  });

  if (!session) {
    throw new NotFoundError("AMA Session");
  }
  return session;
};

/**
 * Updates the status of an AMA Session.
 * Includes authorization and status transition validation.
 * @param sessionId - ID of the session to update.
 * @param newStatus - The target status (validated enum value).
 * @param requestingUser - User performing the update.
 * @returns The updated session data.
 * @throws ApiError (BadRequest, Forbidden, NotFound) for various failures.
 */
export const updateAmaSessionStatus = async (
  sessionId: string,
  newStatus: AMASessionStatus,
  requestingUser: AuthenticatedUser
) => {
  // 1. Authorization
  await authorizeSessionManagement(requestingUser, sessionId);

  // 2. Fetch current status for transition validation
  const currentSession = await prisma.aMASession.findUnique({
    where: { id: sessionId },
    select: { status: true },
  });
  // Not found check is implicitly handled by authorizeSessionManagement, but double check doesn't hurt
  if (!currentSession) {
    throw new NotFoundError("AMA Session"); // Should have been caught by auth check
  }

  // 3. Validate Status Transition Logic
  const currentStatus = currentSession.status;
  const allowedTransitions: Partial<
    Record<AMASessionStatus, AMASessionStatus[]>
  > = {
    [AMASessionStatus.UPCOMING]: [
      AMASessionStatus.LIVE,
      AMASessionStatus.CANCELLED,
    ],
    [AMASessionStatus.LIVE]: [
      AMASessionStatus.ENDED,
      AMASessionStatus.CANCELLED,
    ],
    // ENDED and CANCELLED cannot transition further by default
  };

  if (
    allowedTransitions[currentStatus] &&
    !allowedTransitions[currentStatus]?.includes(newStatus)
  ) {
    throw new BadRequestError(
      `Cannot transition session from ${currentStatus} to ${newStatus}.`
    );
  }
  if (!allowedTransitions[currentStatus] && newStatus !== currentStatus) {
    // Covers trying to change ENDED or CANCELLED status
    throw new BadRequestError(
      `Session is already ${currentStatus.toLowerCase()} and its status cannot be changed.`
    );
  }

  // 4. Update the status in DB
  const updatedSession = await prisma.aMASession.update({
    where: { id: sessionId },
    data: { status: newStatus },
    include: {
      // Return updated data consistent with GET
      host: { select: { id: true, name: true, image: true } },
      _count: { select: { questions: true } },
    },
  });

  // TODO: Trigger notifications (session live, cancelled etc.)

  return updatedSession;
};

// --- Zod Schema (Define or import) ---
export const updateSessionStatusSchema = z
  .object({
    status: z.nativeEnum(AMASessionStatus),
  })
  .strict();

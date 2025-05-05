// services/qnaService.ts

import { prisma } from "@/lib/prisma";
import { PointLogType, Prisma, UserRole, VoteType } from "@prisma/client"; // Import relevant Prisma types/enums
import { z } from "zod";
import {
  ApiError,
  BadRequestError,
  ForbiddenError,
  NotFoundError, // Import custom errors
} from "@/lib/api/responses";
import { Value } from "@udecode/plate";
import {
  POINTS_ANSWER_ACCEPTED_AUTHOR,
  POINTS_ANSWER_ACCEPTED_SELECTOR,
  POINTS_ANSWER_POSTED,
  POINTS_ANSWER_UPVOTE_RECEIVED,
  POINTS_QUESTION_UPVOTE_RECEIVED,
  POINTS_UPVOTE_GIVEN,
} from "@/lib/constants";

// Define or import AuthenticatedUser type
interface AuthenticatedUser {
  id: string;
  role?: UserRole | null;
  // other fields...
}

interface VoteInput {
  userId: string;
  voteType: VoteType; // Currently only UPVOTE
}

interface VoteResult {
  newVoteCount: number;
  userVote: VoteType | null; // What the user's vote is now (UPVOTE or null if removed)
}
// --- Zod Schemas ---
export const CreateQuestionInputSchema = z
  .object({
    title: z
      .string()
      .min(5, "Title must be at least 5 characters long")
      .max(200),
    content: z.any(), // Use z.any() for JSON from Plate.js, validate structure if needed
    tags: z
      .array(z.string().min(1).max(50))
      .min(1, "At least one tag is required")
      .max(5, "Maximum of 5 tags allowed"),
  })
  .strict();

export const UpdateQuestionInputSchema = z
  .object({
    title: z.string().min(5).max(200).optional(),
    content: z.any().optional(),
    tags: z.array(z.string().min(1).max(50)).min(1).max(5).optional(),
  })
  .strict();

// --- Authorization Helper ---
/**
 * Checks if the user is authorized to manage (update/delete) a specific question.
 * Throws ForbiddenError if not authorized (Author or Admin).
 * Throws NotFoundError if the question doesn't exist.
 * @param user - The authenticated user object (must include id and role).
 * @param questionId - The ID of the question to manage.
 */
export const authorizeQuestionManagement = async (
  user: AuthenticatedUser,
  questionId: string
): Promise<void> => {
  if (!user?.id || user.role === undefined) {
    throw new ForbiddenError("User information incomplete for authorization.");
  }
  try {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { authorId: true }, // Only need authorId
    });

    if (!question) {
      throw new NotFoundError("Question");
    }

    const isAuthor = question.authorId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenError(
        "You do not have permission to manage this question."
      );
    }
    // Authorized
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("Error during question management authorization:", error);
    throw new Error("Failed to verify question management authorization.");
  }
};

// --- Service Functions ---

/**
 * Creates a new question, handles tags, within a transaction.
 */
export const createQuestion = async (
  data: z.infer<typeof CreateQuestionInputSchema>,
  author: AuthenticatedUser
) => {
  if (!author?.id) throw new ForbiddenError("Authentication required."); // Defensive check

  const createdQuestion = await prisma.$transaction(async (tx) => {
    const newQuestion = await tx.question.create({
      data: {
        title: data.title,
        content: data.content as Prisma.InputJsonValue, // Cast Plate.js JSON
        authorId: author.id,
      },
    });

    // Handle Tags: Find existing or create new ones (lowercase for consistency)
    const tagNamesLower = data.tags.map((t) => t.toLowerCase());
    const tagOps = tagNamesLower.map((tagName) =>
      tx.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      })
    );
    const tags = await Promise.all(tagOps);

    // Link tags to the question
    await tx.questionTag.createMany({
      data: tags.map((tag) => ({
        questionId: newQuestion.id,
        tagId: tag.id,
      })),
    });

    // Return the newly created question with essential details
    return tx.question.findUnique({
      where: { id: newQuestion.id },
      select: {
        // Select fields needed for immediate response/redirect
        id: true,
        title: true,
        createdAt: true,
        author: { select: { id: true, name: true, image: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
      },
    });
  });

  if (!createdQuestion) {
    // Should not happen in a successful transaction, but good practice
    throw new Error(
      "Failed to retrieve created question details after transaction."
    );
  }

  return createdQuestion;
};

interface ListQuestionsParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "votes" | "answers"; // Add more as needed
  order?: "asc" | "desc";
  tagName?: string | null;
  // Add userId for 'my questions' filter later
}
/**
 * Lists questions with pagination, sorting, and filtering by tag.
 */
export const listQuestions = async (params: ListQuestionsParams) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    order = "desc",
    tagName,
  } = params;

  const skip = (page - 1) * limit;
  let orderBy: Prisma.QuestionOrderByWithRelationInput = {};

  // Basic sorting
  if (sortBy === "createdAt") {
    orderBy = { createdAt: order as Prisma.SortOrder };
  }
  // TODO: Implement sorting by votes/answers count (might require adjustments)
  // if (sortBy === 'votes') orderBy = { votes: { _count: order } };
  // if (sortBy === 'answers') orderBy = { answers: { _count: order } };

  let where: Prisma.QuestionWhereInput = {};
  if (tagName) {
    where = {
      tags: { some: { tag: { name: tagName.toLowerCase() } } }, // Filter by lowercase tag
    };
  }

  const [questions, totalCount] = await Promise.all([
    prisma.question.findMany({
      where,
      skip: skip,
      take: limit,
      orderBy,
      include: {
        // Include necessary data for list view
        author: { select: { id: true, name: true, image: true } },
        tags: { include: { tag: { select: { name: true, id: true } } } },
        _count: { select: { answers: true, votes: true } },
        acceptedAnswer: { select: { id: true } }, // Just need to know if one exists
      },
    }),
    prisma.question.count({ where }),
  ]);

  return {
    data: questions,
    meta: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

/**
 * Fetches detailed information for a single question, including answers and vote status.
 */
export const getQuestionDetails = async (
  questionId: string,
  requestingUserId?: string | null
) => {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      author: { select: { id: true, name: true, image: true } },
      tags: { include: { tag: { select: { name: true, id: true } } } },
      answers: {
        orderBy: [{ isAccepted: "desc" }, { createdAt: "asc" }],
        include: {
          author: { select: { id: true, name: true, image: true } },
          votes: {
            // Fetch votes to calculate count and user status
            select: { userId: true, voteType: true },
          },
          // Do not include votes *within* answer votes again
        },
      },
      votes: {
        // Fetch question votes
        select: { userId: true, voteType: true },
      },
      acceptedAnswer: { select: { id: true } },
    },
  });
  console.log(question);
  if (!question) {
    throw new NotFoundError("Question");
  }

  // --- Process Votes ---
  // Process question votes (assuming VoteType enum exists, e.g., UPVOTE, DOWNVOTE)
  // let questionVoteScore = 0;
  // question.votes.forEach(v => {
  //     if(v.voteType === VoteType.UPVOTE) questionVoteScore++;
  //     // else if (v.voteType === VoteType.DOWNVOTE) questionVoteScore--; // If downvotes exist
  // });
  const questionVoteCount = question.votes.length; // Or use score if calculated
  const userQuestionVote = requestingUserId
    ? question.votes.find((v) => v.userId === requestingUserId)
    : null;

  // Process answer votes
  const answersWithVoteInfo = question.answers.map((answer) => {
    // let answerVoteScore = 0;
    // answer.votes.forEach(v => {
    //     if(v.voteType === VoteType.UPVOTE) answerVoteScore++;
    //     // else if (v.voteType === VoteType.DOWNVOTE) answerVoteScore--;
    // });
    const answerVoteCount = answer.votes.length; // Or score
    const userAnswerVote = requestingUserId
      ? answer.votes.find((v) => v.userId === requestingUserId)
      : null;
    const { votes, ...answerData } = answer; // Remove raw votes array
    return {
      ...answerData,
      voteCount: answerVoteCount, // Or voteScore
      userVote: userAnswerVote ? userAnswerVote.voteType : null,
    };
  });

  // Prepare final response, removing raw vote arrays
  const { votes, answers, ...questionData } = question;
  const responseData = {
    ...questionData,
    voteCount: questionVoteCount, // Or voteScore
    userVote: userQuestionVote ? userQuestionVote.voteType : null,
    answers: answersWithVoteInfo,
  };

  return responseData;
};

/**
 * Updates an existing question (title, content, tags). Placeholder.
 * Requires authorization check.
 */
export const updateQuestion = async (
  questionId: string,
  data: z.infer<typeof UpdateQuestionInputSchema>,
  requestingUser: AuthenticatedUser
) => {
  await authorizeQuestionManagement(requestingUser, questionId);

  // --- Placeholder ---
  console.log("Service: Updating question", questionId, "with data:", data);
  // TODO: Implement actual update logic using prisma.$transaction
  // 1. Update question fields (title, content) if present in data
  // 2. Handle tag updates:
  //    - Get current tags associated with the question.
  //    - Determine tags to add (new in data, not current).
  //    - Determine tags to remove (current, not in data).
  //    - Upsert new tags in the Tag table.
  //    - Delete links for removed tags in QuestionTag table.
  //    - Create links for added tags in QuestionTag table.
  // 3. Fetch and return the updated question details.

  // For now, just fetch and return existing data as if updated
  return getQuestionDetails(questionId, requestingUser.id);
  // --- End Placeholder ---

  // throw new Error("Update functionality not yet implemented."); // Use this once ready
};

/**
 * Deletes an existing question. Placeholder.
 * Requires authorization check.
 */
export const deleteQuestion = async (
  questionId: string,
  requestingUser: AuthenticatedUser
) => {
  await authorizeQuestionManagement(requestingUser, questionId);

  // --- Placeholder ---
  console.log("Service: Deleting question", questionId);
  // TODO: Implement actual delete logic using prisma.question.delete()
  // Prisma schema cascades should handle related QuestionTag, Answer, Vote deletions.
  // const deleted = await prisma.question.delete({ where: { id: questionId } });
  // return deleted; // Or return nothing on success
  // --- End Placeholder ---

  // throw new Error("Delete functionality not yet implemented."); // Use this once ready
};

/**
 * Creates a new answer for a specific question.
 */
// export const createAnswerForQuestion = async (
//   questionId: string,
//   content: Value, // Receive Plate Value type
//   authorId: string
// ) => {
//   // 1. Verify Question Exists (already done in API route, but can double-check)
//   const questionExists = await prisma.question.findUnique({
//     where: { id: questionId },
//     select: { id: true },
//   });
//   if (!questionExists) throw new NotFoundError("Question");

//   // 2. Create Answer
//   const newAnswer = await prisma.answer.create({
//     data: {
//       content: content as any, // Cast content (Prisma expects JsonValue)
//       questionId: questionId,
//       authorId: authorId,
//     },
//     select: {
//       // Select fields needed for API response
//       id: true,
//       content: true,
//       createdAt: true,
//       authorId: true,
//       questionId: true,
//       // author: { select: { id: true, name: true, image: true } }
//     },
//   });

//   // 3. TODO: Award points / Trigger notifications
//   // await awardPointsForAnswer(authorId, newAnswer.id);
//   // await notifyQuestionAuthor(questionId, newAnswer.id, authorId);

//   return newAnswer;
// };

/**
 * Handles voting on a Question. Creates/deletes votes and updates points.
 */
export const voteQuestion = async (
  questionId: string,
  voteInput: VoteInput // { userId, voteType }
): Promise<VoteResult> => {
  const { userId, voteType } = voteInput;

  // Use transaction for atomicity
  return prisma.$transaction(async (tx) => {
    const question = await tx.question.findUnique({
      where: { id: questionId },
      select: { id: true, authorId: true },
    });
    if (!question) throw new NotFoundError("Question");

    // Prevent self-voting
    if (question.authorId === userId) {
      throw new BadRequestError("You cannot vote on your own question.");
    }

    const existingVote = await tx.vote.findUnique({
      where: { userId_questionId: { userId, questionId } },
    });

    let userVoteStatus: VoteType | null = null;
    let createdVote: { id: string } | null = null; // Store created vote for point log

    if (existingVote) {
      // Remove existing vote (un-upvote)
      await tx.vote.delete({ where: { id: existingVote.id } });
      userVoteStatus = null;
      // Deduct points (careful logic needed if points were awarded previously)
      // Example: Deduct points from author and voter if rules dictate
      await tx.user.update({
        where: { id: question.authorId },
        data: { points: { decrement: POINTS_QUESTION_UPVOTE_RECEIVED } },
      });
      await tx.user.update({
        where: { id: userId },
        data: { points: { decrement: POINTS_UPVOTE_GIVEN } },
      });
      // Maybe delete related PointLog entries? Or mark them as reversed? Complex.
      // Simpler: Only award points on initial upvote, don't deduct on removal.
    } else {
      // Create new vote
      createdVote = await tx.vote.create({
        data: { userId, questionId, voteType: VoteType.UPVOTE },
        select: { id: true }, // Get ID for logging
      });
      userVoteStatus = VoteType.UPVOTE;

      // Award points to question author
      await tx.user.update({
        where: { id: question.authorId },
        data: { points: { increment: POINTS_QUESTION_UPVOTE_RECEIVED } },
      });
      // Award points to voter
      await tx.user.update({
        where: { id: userId },
        data: { points: { increment: POINTS_UPVOTE_GIVEN } },
      });

      // Log points for voter (link to the new vote)
      await tx.pointLog.create({
        data: {
          userId: userId,
          pointsAwarded: POINTS_UPVOTE_GIVEN,
          type: PointLogType.UPVOTE_GIVEN,
          reason: `Upvoted question ${questionId}`,
          relatedVoteId: createdVote.id, // Link to the vote record
        },
      });
      // Log points for question author (link to the new vote maybe?)
      await tx.pointLog.create({
        data: {
          userId: question.authorId,
          pointsAwarded: POINTS_QUESTION_UPVOTE_RECEIVED,
          type: PointLogType.QUESTION_UPVOTE_RECEIVED,
          reason: `Received upvote on question ${questionId}`,
          relatedVoteId: createdVote.id,
        },
      });
    }

    const newVoteCount = await tx.vote.count({
      where: { questionId: questionId, voteType: VoteType.UPVOTE },
    });
    return { newVoteCount, userVote: userVoteStatus };
  });
};

/**
 * Handles voting on an Answer. Creates/deletes votes and updates points.
 */

export const voteAnswer = async (
  answerId: string,
  voteInput: VoteInput
): Promise<VoteResult> => {
  const { userId, voteType } = voteInput;

  return prisma.$transaction(async (tx) => {
    const answer = await tx.answer.findUnique({
      where: { id: answerId },
      select: { id: true, authorId: true },
    });
    if (!answer) throw new NotFoundError("Answer");

    // Prevent self-voting
    if (answer.authorId === userId) {
      throw new BadRequestError("You cannot vote on your own answer.");
    }

    const existingVote = await tx.vote.findUnique({
      where: { userId_answerId: { userId, answerId } },
    });

    let userVoteStatus: VoteType | null = null;
    let createdVote: { id: string } | null = null;

    if (existingVote) {
      // Remove vote
      await tx.vote.delete({ where: { id: existingVote.id } });
      userVoteStatus = null;
      // TODO: Point deduction logic if needed (similar to question vote)
      await tx.user.update({
        where: { id: answer.authorId },
        data: { points: { decrement: POINTS_ANSWER_UPVOTE_RECEIVED } },
      });
      await tx.user.update({
        where: { id: userId },
        data: { points: { decrement: POINTS_UPVOTE_GIVEN } },
      });
    } else {
      // Create vote
      createdVote = await tx.vote.create({
        data: { userId, answerId, voteType: VoteType.UPVOTE },
        select: { id: true },
      });
      userVoteStatus = VoteType.UPVOTE;

      // Award points to answer author
      await tx.user.update({
        where: { id: answer.authorId },
        data: { points: { increment: POINTS_ANSWER_UPVOTE_RECEIVED } },
      });
      // Award points to voter
      await tx.user.update({
        where: { id: userId },
        data: { points: { increment: POINTS_UPVOTE_GIVEN } },
      });

      // Log points for voter
      await tx.pointLog.create({
        data: {
          userId: userId,
          pointsAwarded: POINTS_UPVOTE_GIVEN,
          type: PointLogType.UPVOTE_GIVEN,
          reason: `Upvoted answer ${answerId}`,
          relatedVoteId: createdVote.id,
        },
      });
      // Log points for answer author
      await tx.pointLog.create({
        data: {
          userId: answer.authorId,
          pointsAwarded: POINTS_ANSWER_UPVOTE_RECEIVED,
          type: PointLogType.ANSWER_UPVOTE_RECEIVED,
          reason: `Received upvote on answer ${answerId}`,
          relatedVoteId: createdVote.id,
        },
      });
    }

    const newVoteCount = await tx.vote.count({
      where: { answerId: answerId, voteType: VoteType.UPVOTE },
    });
    return { newVoteCount, userVote: userVoteStatus };
  });
};
export const createAnswerForQuestion = async (
  questionId: string,
  content: Value,
  authorId: string
) => {
  // Use transaction to create answer, award points, and log points atomically
  return prisma.$transaction(async (tx) => {
    // 1. Verify Question Exists
    const questionExists = await tx.question.findUnique({
      where: { id: questionId },
      select: { id: true },
    });
    if (!questionExists) throw new NotFoundError("Question");

    // 2. Create Answer
    const newAnswer = await tx.answer.create({
      data: {
        content: content as any,
        questionId: questionId,
        authorId: authorId,
      },
      select: {
        // Select fields needed for API response and point log
        id: true,
        content: true,
        createdAt: true,
        authorId: true,
        questionId: true,
      },
    });

    // 3. Award Points to Answer Author
    await tx.user.update({
      where: { id: authorId },
      data: { points: { increment: POINTS_ANSWER_POSTED } },
    });

    // 4. Log the Points
    await tx.pointLog.create({
      data: {
        userId: authorId,
        pointsAwarded: POINTS_ANSWER_POSTED,
        type: PointLogType.ANSWER_POSTED,
        reason: `Posted an answer to question ${questionId}`, // Optional detail
        postedAnswerId: newAnswer.id, // Link log to the answer
      },
    });

    return newAnswer; // Return the created answer
  });
};

export const acceptAnswer = async (
  questionId: string,
  answerId: string,
  questionAuthorId: string // ID of user performing the action
): Promise<{
  updatedQuestion: { acceptedAnswerId: string | null };
  updatedAnswer: { id: string; isAccepted: boolean };
}> => {
  // Use transaction for atomicity
  return prisma.$transaction(async (tx) => {
    // 1. Verify the question exists and the user is the author
    const question = await tx.question.findUnique({
      where: { id: questionId },
      select: { authorId: true, acceptedAnswerId: true },
    });
    if (!question) throw new NotFoundError("Question");
    if (question.authorId !== questionAuthorId)
      throw new ForbiddenError(
        "Only the question author can accept an answer."
      );

    // 2. Verify the answer exists and belongs to this question
    const answer = await tx.answer.findUnique({
      where: { id: answerId },
      select: { id: true, questionId: true, authorId: true },
    });
    if (!answer || answer.questionId !== questionId)
      throw new NotFoundError("Answer");

    // 3. Check if an answer is already accepted OR if un-accepting
    const currentlyAcceptedId = question.acceptedAnswerId;
    const isUnaccepting = currentlyAcceptedId === answerId;
    const isAcceptingNew = !currentlyAcceptedId && !isUnaccepting;
    const isChangingAccepted = currentlyAcceptedId && !isUnaccepting;

    if (isUnaccepting) {
      // --- Un-accepting the answer ---
      const [updatedQ, updatedA] = await Promise.all([
        tx.question.update({
          where: { id: questionId },
          data: { acceptedAnswerId: null },
        }),
        tx.answer.update({
          where: { id: answerId },
          data: { isAccepted: false },
        }),
      ]);
      // TODO: Point deduction logic (complex - need to find original point logs)
      // For simplicity, often points are not deducted when un-accepted.
      console.log(
        `[acceptAnswer] Answer ${answerId} un-accepted for question ${questionId}`
      );
      return { updatedQuestion: updatedQ, updatedAnswer: updatedA };
    } else if (isAcceptingNew || isChangingAccepted) {
      // --- Accepting this answer ---
      // If changing, first un-accept the old one
      if (isChangingAccepted && currentlyAcceptedId) {
        await tx.answer.update({
          where: { id: currentlyAcceptedId },
          data: { isAccepted: false },
        });
        // TODO: Point deduction for previously accepted answer author?
      }

      // Accept the new answer and link it to the question
      const [updatedQ, updatedA] = await Promise.all([
        tx.question.update({
          where: { id: questionId },
          data: { acceptedAnswerId: answerId },
        }),
        tx.answer.update({
          where: { id: answerId },
          data: { isAccepted: true },
        }),
      ]);

      // Award points to answer author
      await tx.user.update({
        where: { id: answer.authorId },
        data: { points: { increment: POINTS_ANSWER_ACCEPTED_AUTHOR } },
      });
      // Award points to question author (selector)
      await tx.user.update({
        where: { id: questionAuthorId },
        data: { points: { increment: POINTS_ANSWER_ACCEPTED_SELECTOR } },
      });

      // Log points for answer author
      await tx.pointLog.create({
        data: {
          userId: answer.authorId,
          pointsAwarded: POINTS_ANSWER_ACCEPTED_AUTHOR,
          type: PointLogType.ANSWER_ACCEPTED_AUTHOR,
          reason: `Answer ${answerId} accepted for question ${questionId}`,
          acceptedAnswerId: answerId, // Link log to the accepted answer
        },
      });
      // Log points for question author
      await tx.pointLog.create({
        data: {
          userId: questionAuthorId,
          pointsAwarded: POINTS_ANSWER_ACCEPTED_SELECTOR,
          type: PointLogType.ANSWER_ACCEPTED_SELECTOR,
          reason: `Accepted answer ${answerId} for question ${questionId}`,
          acceptedAnswerId: answerId,
        },
      });

      console.log(
        `[acceptAnswer] Answer ${answerId} accepted for question ${questionId}`
      );
      return { updatedQuestion: updatedQ, updatedAnswer: updatedA };
    } else {
      // Should not happen if logic is correct
      throw new Error("Invalid state for accepting answer.");
    }
  });
};

// services/qnaService.ts

import { prisma } from "@/lib/prisma";
import { PointLogType, Prisma, UserRole, VoteType } from "@prisma/client";
import { z } from "zod";
import {
  ApiError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/api/responses";
import { Value } from "@udecode/plate";
import { getPointsForAction } from "@/lib/constants";
import { awardPoints, deductPoints } from "@/lib/points";

// Define AuthenticatedUser type
interface AuthenticatedUser {
  id: string;
  role?: UserRole | null;
}

interface VoteInput {
  userId: string;
  // voteType: VoteType; // Always UPVOTE for now
}

interface VoteResult {
  newVoteCount: number;
  userVote: VoteType | null;
}

// --- Zod Schemas ---
export const CreateQuestionInputSchema = z
  .object({
    title: z
      .string()
      .min(5, "Title must be at least 5 characters long")
      .max(200),
    content: z.custom<Value>((val) => Array.isArray(val) && val.length > 0, { // Basic validation for Plate.js
      message: "Content must be a valid Plate.js document (non-empty array).",
    }),
    tags: z
      .array(z.string().min(1).max(50))
      .min(1, "At least one tag is required")
      .max(5, "Maximum of 5 tags allowed"),
  })
  .strict();

export const UpdateQuestionInputSchema = z
  .object({
    title: z.string().min(5).max(200).optional(),
    content: z.custom<Value>((val) => Array.isArray(val) && val.length > 0, {
      message: "Content must be a valid Plate.js document (non-empty array).",
    }).optional(),
    tags: z.array(z.string().min(1).max(50)).min(1).max(5).optional(),
  })
  .strict()
  .refine(obj => Object.keys(obj).length > 0, {
    message: "At least one field (title, content, or tags) must be provided for update.",
  });


// --- Authorization Helper ---
export const authorizeQuestionManagement = async (
  user: AuthenticatedUser,
  questionId: string
): Promise<{ authorId: string }> => {
  if (!user?.id || user.role === undefined) {
    throw new ForbiddenError("User information incomplete for authorization.");
  }
  try {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { authorId: true },
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
    return { authorId: question.authorId };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("Error during question management authorization:", error);
    throw new Error("Failed to verify question management authorization.");
  }
};

// --- Service Functions ---
export const createQuestion = async (
  data: z.infer<typeof CreateQuestionInputSchema>,
  author: AuthenticatedUser
) => {
  if (!author?.id) throw new ForbiddenError("Authentication required.");

  return prisma.$transaction(async (tx) => { // Changed variable name for clarity
    const newQuestion = await tx.question.create({
      data: {
        title: data.title,
        content: data.content as Prisma.InputJsonValue, // Cast is okay after Zod validation
        authorId: author.id,
      },
    });

    const tagNamesLower = data.tags.map((t) => t.toLowerCase());
    const tagOps = tagNamesLower.map((tagName) =>
      tx.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      })
    );
    const tags = await Promise.all(tagOps);

    await tx.questionTag.createMany({
      data: tags.map((tag) => ({
        questionId: newQuestion.id,
        tagId: tag.id,
      })),
    });

    await awardPoints({
        userId: author.id,
        actionType: PointLogType.QUESTION_POSTED,
        reason: `Posted question: "${newQuestion.title.substring(0,30)}..."`,
        relatedQuestionId: newQuestion.id,
    });

    return tx.question.findUnique({
      where: { id: newQuestion.id },
      select: {
        id: true,
        title: true,
        createdAt: true,
        author: { select: { id: true, name: true, image: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
      },
    });
  });
};

interface ListQuestionsParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "votes" | "answers";
  order?: "asc" | "desc";
  tagName?: string | null;
}
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

  if (sortBy === "createdAt") {
    orderBy = { createdAt: order as Prisma.SortOrder };
  } else if (sortBy === 'votes') {
    orderBy = { votes: { _count: order as Prisma.SortOrder } };
  } else if (sortBy === 'answers') {
    orderBy = { answers: { _count: order as Prisma.SortOrder } };
  }

  let where: Prisma.QuestionWhereInput = {};
  if (tagName) {
    where = {
      tags: { some: { tag: { name: tagName.toLowerCase() } } },
    };
  }

  const [questions, totalCount] = await Promise.all([
    prisma.question.findMany({
      where,
      skip: skip,
      take: limit,
      orderBy,
      include: {
        author: { select: { id: true, name: true, image: true } },
        tags: { include: { tag: { select: { name: true, id: true } } } },
        _count: { select: { answers: true, votes: true } },
        acceptedAnswer: { select: { id: true } },
      },
    }),
    prisma.question.count({ where }),
  ]);

  return {
    data: questions.map(q => ({
        ...q,
        voteCount: q._count.votes,
        answerCount: q._count.answers,
    })),
    meta: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

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
          votes: { select: { userId: true, voteType: true } },
        },
      },
      votes: { select: { userId: true, voteType: true } },
      acceptedAnswer: { select: { id: true } },
    },
  });

  if (!question) {
    throw new NotFoundError("Question");
  }

  const questionVoteCount = question.votes.filter(v => v.voteType === VoteType.UPVOTE).length;
  const userQuestionVote = requestingUserId
    ? question.votes.find((v) => v.userId === requestingUserId)?.voteType || null
    : null;

  const answersWithVoteInfo = question.answers.map((answer) => {
    const answerVoteCount = answer.votes.filter(v => v.voteType === VoteType.UPVOTE).length;
    const userAnswerVote = requestingUserId
      ? answer.votes.find((v) => v.userId === requestingUserId)?.voteType || null
      : null;
    const { votes: answerRawVotes, ...answerData } = answer; // Renamed to avoid conflict
    return {
      ...answerData,
      voteCount: answerVoteCount,
      userVote: userAnswerVote,
    };
  });

  const { votes: questionRawVotes, answers, ...questionData } = question; // Renamed
  return {
    ...questionData,
    voteCount: questionVoteCount,
    userVote: userQuestionVote,
    answers: answersWithVoteInfo,
  };
};

export const updateQuestion = async (
  questionId: string,
  data: z.infer<typeof UpdateQuestionInputSchema>,
  requestingUser: AuthenticatedUser
) => {
  await authorizeQuestionManagement(requestingUser, questionId);

  return prisma.$transaction(async (tx) => {
    const updatePayload: Prisma.QuestionUpdateInput = {};
    if (data.title) updatePayload.title = data.title;
    if (data.content) updatePayload.content = data.content as Prisma.InputJsonValue; // Cast after Zod

    if (Object.keys(updatePayload).length > 0) {
      await tx.question.update({
        where: { id: questionId },
        data: updatePayload,
      });
    }

    if (data.tags) {
      const newTagNamesLower = data.tags.map(t => t.toLowerCase());
      const currentQuestionTags = await tx.questionTag.findMany({
        where: { questionId },
        select: { tag: { select: { id: true, name: true } } },
      });
      const currentTagNames = currentQuestionTags.map(qt => qt.tag.name);

      const tagsToAddNames = newTagNamesLower.filter(ntn => !currentTagNames.includes(ntn));
      const tagsToRemoveDetails = currentQuestionTags.filter(ct => !newTagNamesLower.includes(ct.tag.name));

      if (tagsToRemoveDetails.length > 0) {
        await tx.questionTag.deleteMany({
          where: {
            questionId,
            tagId: { in: tagsToRemoveDetails.map(t => t.tag.id) },
          },
        });
      }

      if (tagsToAddNames.length > 0) {
        const newTagOps = tagsToAddNames.map(tagName =>
          tx.tag.upsert({
            where: { name: tagName }, update: {}, create: { name: tagName },
          })
        );
        const createdOrFoundTags = await Promise.all(newTagOps);
        await tx.questionTag.createMany({
          data: createdOrFoundTags.map(tag => ({ questionId, tagId: tag.id })),
        });
      }
    }
    return getQuestionDetails(questionId, requestingUser.id);
  });
};


export const deleteQuestion = async (
  questionId: string,
  requestingUser: AuthenticatedUser
) => {
  const { authorId } = await authorizeQuestionManagement(requestingUser, questionId);

  return prisma.$transaction(async (tx) => {
    // Consider more complex point deduction logic here for associated votes, accepted answer etc.
    // For now, just deleting the question. Prisma's onDelete: Cascade handles related entities.
    const deletedQuestion = await tx.question.delete({
      where: { id: questionId },
      select: { title: true, id: true } // Select title for reason in point log
    });

    // Optional: Deduct points from author for deleting their question
    // if (getPointsForAction(PointLogType.QUESTION_POSTED) > 0) { // Only deduct if posting gave points
    //   await deductPoints({
    //     userId: authorId,
    //     actionType: PointLogType.QUESTION_POSTED, // Use original type for symmetry
    //     originalPointsToDeduct: getPointsForAction(PointLogType.QUESTION_POSTED),
    //     reason: `Deleted question: "${deletedQuestion.title.substring(0,30)}..."`,
    //     relatedQuestionId: deletedQuestion.id
    //   });
    // }

    return { id: deletedQuestion.id, message: "Question deleted successfully." };
  });
};

export const createAnswerForQuestion = async (
  questionId: string,
  content: Value,
  authorId: string
) => {
  return prisma.$transaction(async (tx) => {
    const questionExists = await tx.question.findUnique({
      where: { id: questionId }, select: { id: true },
    });
    if (!questionExists) throw new NotFoundError("Question to answer not found.");

    const newAnswer = await tx.answer.create({
      data: {
        content: content as Prisma.InputJsonValue, // Cast after Zod/type validation
        questionId: questionId,
        authorId: authorId,
      },
      include: { author: { select: {id: true, name: true, image: true }} }
    });

    await awardPoints({
      userId: authorId,
      actionType: PointLogType.ANSWER_POSTED,
      reason: `Posted answer for question ${questionId}`,
      relatedPostedAnswerId: newAnswer.id, // Correctly use relatedPostedAnswerId
    });

    return newAnswer;
  });
};

export const voteQuestion = async (
  questionId: string,
  voteInput: VoteInput
): Promise<VoteResult> => {
  const { userId } = voteInput;

  return prisma.$transaction(async (tx) => {
    const question = await tx.question.findUnique({
      where: { id: questionId }, select: { id: true, authorId: true },
    });
    if (!question) throw new NotFoundError("Question");
    if (question.authorId === userId) {
      throw new BadRequestError("You cannot vote on your own question.");
    }

    const existingVote = await tx.vote.findUnique({
      where: { userId_questionId: { userId, questionId } },
    });
    let userVoteStatus: VoteType | null = null;

    if (existingVote) {
      await tx.vote.delete({ where: { id: existingVote.id } });
      userVoteStatus = null;

      await deductPoints({
          userId: question.authorId,
          actionType: PointLogType.QUESTION_UPVOTE_RECEIVED,
          originalPointsToDeduct: getPointsForAction(PointLogType.QUESTION_UPVOTE_RECEIVED),
          reason: `Question upvote removed by ${userId} for question ${questionId}`,
          relatedQuestionId: questionId, relatedVoteId: existingVote.id,
      });
      await deductPoints({
          userId: userId, actionType: PointLogType.UPVOTE_GIVEN,
          originalPointsToDeduct: getPointsForAction(PointLogType.UPVOTE_GIVEN),
          reason: `Removed upvote from question ${questionId}`,
          relatedQuestionId: questionId, relatedVoteId: existingVote.id,
      });
    } else {
      const newVote = await tx.vote.create({
        data: { userId, questionId, voteType: VoteType.UPVOTE }, select: { id: true },
      });
      userVoteStatus = VoteType.UPVOTE;

      await awardPoints({
          userId: question.authorId, actionType: PointLogType.QUESTION_UPVOTE_RECEIVED,
          reason: `Received upvote on question ${questionId} from ${userId}`,
          relatedQuestionId: questionId, relatedVoteId: newVote.id,
      });
      await awardPoints({
          userId: userId, actionType: PointLogType.UPVOTE_GIVEN,
          reason: `Upvoted question ${questionId}`,
          relatedQuestionId: questionId, relatedVoteId: newVote.id,
      });
    }
    const newVoteCount = await tx.vote.count({
      where: { questionId: questionId, voteType: VoteType.UPVOTE },
    });
    return { newVoteCount, userVote: userVoteStatus };
  });
};

export const voteAnswer = async (
  answerId: string,
  voteInput: VoteInput
): Promise<VoteResult> => {
  const { userId } = voteInput;

  return prisma.$transaction(async (tx) => {
    const answer = await tx.answer.findUnique({
      where: { id: answerId }, select: { id: true, authorId: true },
    });
    if (!answer) throw new NotFoundError("Answer");
    if (answer.authorId === userId) {
      throw new BadRequestError("You cannot vote on your own answer.");
    }

    const existingVote = await tx.vote.findUnique({
      where: { userId_answerId: { userId, answerId } },
    });
    let userVoteStatus: VoteType | null = null;

    if (existingVote) {
      await tx.vote.delete({ where: { id: existingVote.id } });
      userVoteStatus = null;

      await deductPoints({
          userId: answer.authorId, actionType: PointLogType.ANSWER_UPVOTE_RECEIVED,
          originalPointsToDeduct: getPointsForAction(PointLogType.ANSWER_UPVOTE_RECEIVED),
          reason: `Answer upvote removed by ${userId} for answer ${answerId}`,
          relatedPostedAnswerId: answerId, // Use relatedPostedAnswerId
          relatedVoteId: existingVote.id,
      });
      await deductPoints({
          userId: userId, actionType: PointLogType.UPVOTE_GIVEN,
          originalPointsToDeduct: getPointsForAction(PointLogType.UPVOTE_GIVEN),
          reason: `Removed upvote from answer ${answerId}`,
          relatedPostedAnswerId: answerId, // Use relatedPostedAnswerId
          relatedVoteId: existingVote.id,
      });
    } else {
      const newVote = await tx.vote.create({
        data: { userId, answerId, voteType: VoteType.UPVOTE }, select: { id: true },
      });
      userVoteStatus = VoteType.UPVOTE;

      await awardPoints({
          userId: answer.authorId, actionType: PointLogType.ANSWER_UPVOTE_RECEIVED,
          reason: `Received upvote on answer ${answerId} from ${userId}`,
          relatedPostedAnswerId: answerId, // Use relatedPostedAnswerId
          relatedVoteId: newVote.id,
      });
      await awardPoints({
          userId: userId, actionType: PointLogType.UPVOTE_GIVEN,
          reason: `Upvoted answer ${answerId}`,
          relatedPostedAnswerId: answerId, // Use relatedPostedAnswerId
          relatedVoteId: newVote.id,
      });
    }
    const newVoteCount = await tx.vote.count({
      where: { answerId: answerId, voteType: VoteType.UPVOTE },
    });
    return { newVoteCount, userVote: userVoteStatus };
  });
};

export const acceptAnswer = async (
  questionId: string,
  answerId: string,
  questionAuthorActionUserId: string
): Promise<{
  updatedQuestion: { acceptedAnswerId: string | null };
  updatedAnswer: { id: string; isAccepted: boolean };
}> => {
  return prisma.$transaction(async (tx) => {
    const question = await tx.question.findUnique({
      where: { id: questionId }, select: { authorId: true, acceptedAnswerId: true },
    });
    if (!question) throw new NotFoundError("Question");
    if (question.authorId !== questionAuthorActionUserId) {
      throw new ForbiddenError("Only the question author can accept an answer.");
    }

    const answerToModify = await tx.answer.findUnique({
      where: { id: answerId }, select: { id: true, questionId: true, authorId: true, isAccepted: true },
    });
    if (!answerToModify || answerToModify.questionId !== questionId) {
      throw new NotFoundError("Answer not found or does not belong to this question.");
    }

    const currentlyAcceptedAnswerId = question.acceptedAnswerId;
    let updatedQuestionData: Prisma.QuestionUpdateArgs['data'] = {}; // Use Prisma.QuestionUpdateArgs['data']
    let updatedAnswerData: Prisma.AnswerUpdateArgs['data'] = {};   // Use Prisma.AnswerUpdateArgs['data']
    let pointsAwardedToAnswerAuthor = false;
    let pointsAwardedToSelector = false;

    if (currentlyAcceptedAnswerId === answerId) { // Un-accepting
      updatedQuestionData.acceptedAnswer = { disconnect: true }; // Correct way to unset relation
      updatedAnswerData.isAccepted = false;

      await deductPoints({
        userId: answerToModify.authorId, actionType: PointLogType.ANSWER_ACCEPTED_AUTHOR,
        originalPointsToDeduct: getPointsForAction(PointLogType.ANSWER_ACCEPTED_AUTHOR),
        reason: `Answer ${answerId} un-accepted for question ${questionId}`,
        relatedAcceptedAnswerId: answerId,
      });
      await deductPoints({
        userId: questionAuthorActionUserId, actionType: PointLogType.ANSWER_ACCEPTED_SELECTOR,
        originalPointsToDeduct: getPointsForAction(PointLogType.ANSWER_ACCEPTED_SELECTOR),
        reason: `Un-accepted answer ${answerId} for own question ${questionId}`,
        relatedAcceptedAnswerId: answerId,
      });
    } else { // Accepting new or changing
      if (currentlyAcceptedAnswerId) {
        const prevAcceptedAnswer = await tx.answer.findUnique({where: {id: currentlyAcceptedAnswerId}, select: {authorId: true}});
        await tx.answer.update({ where: { id: currentlyAcceptedAnswerId }, data: { isAccepted: false } });
        if (prevAcceptedAnswer) {
            await deductPoints({
                userId: prevAcceptedAnswer.authorId, actionType: PointLogType.ANSWER_ACCEPTED_AUTHOR,
                originalPointsToDeduct: getPointsForAction(PointLogType.ANSWER_ACCEPTED_AUTHOR),
                reason: `Accepted answer changed from ${currentlyAcceptedAnswerId} for question ${questionId}`,
                relatedAcceptedAnswerId: currentlyAcceptedAnswerId,
            });
        }
      }
      updatedQuestionData.acceptedAnswer = { connect: { id: answerId } }; // Correct way to set relation
      updatedAnswerData.isAccepted = true;
      pointsAwardedToAnswerAuthor = true;
      pointsAwardedToSelector = true;
    }

    const [finalUpdatedQuestion, finalUpdatedAnswer] = await Promise.all([
      tx.question.update({ where: { id: questionId }, data: updatedQuestionData, select: { acceptedAnswerId: true } }),
      tx.answer.update({ where: { id: answerId }, data: updatedAnswerData, select: { id: true, isAccepted: true } }),
    ]);

    if (pointsAwardedToAnswerAuthor) {
      await awardPoints({
        userId: answerToModify.authorId, actionType: PointLogType.ANSWER_ACCEPTED_AUTHOR,
        reason: `Answer ${answerId} accepted for question ${questionId}`,
        relatedAcceptedAnswerId: answerId,
      });
    }
    if (pointsAwardedToSelector) {
      await awardPoints({
        userId: questionAuthorActionUserId, actionType: PointLogType.ANSWER_ACCEPTED_SELECTOR,
        reason: `Accepted answer ${answerId} for question ${questionId}`,
        relatedAcceptedAnswerId: answerId,
      });
    }
    return { updatedQuestion: finalUpdatedQuestion, updatedAnswer: finalUpdatedAnswer };
  });
};
// services/qnaService.ts

import { prisma } from "@/lib/prisma";
import { Prisma, UserRole, VoteType } from "@prisma/client"; // Import relevant Prisma types/enums
import { z } from "zod";
import {
  ApiError,
  BadRequestError,
  ForbiddenError,
  NotFoundError, // Import custom errors
} from "@/lib/api/responses";

// Define or import AuthenticatedUser type
interface AuthenticatedUser {
  id: string;
  role?: UserRole | null;
  // other fields...
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

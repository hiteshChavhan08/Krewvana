// FILE: lib/actions/question.actions.ts
'use server';

import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma'; // Use the configured prisma client instance

// Define the types for return values to ensure consistency
// Include necessary relations for display

const questionIncludeArgs = {
  author: {
    select: { id: true, name: true, image: true },
  },
  tags: {
    select: {
      tag: {
        select: { id: true, name: true },
      },
    },
  },
  _count: {
    select: { answers: true, votes: true }, // Get counts for answers and votes
  },
} satisfies Prisma.QuestionInclude;

export type QuestionWithDetails = Prisma.QuestionGetPayload<{
  include: typeof questionIncludeArgs;
}>;

const answerIncludeArgs = {
    author: {
        select: { id: true, name: true, image: true },
    },
    _count: {
        select: { votes: true }
    }
} satisfies Prisma.AnswerInclude;

export type AnswerWithDetails = Prisma.AnswerGetPayload<{
    include: typeof answerIncludeArgs;
}>;

export interface GetQuestionsParams {
  page?: number;
  pageSize?: number;
  // TODO: Add filter, sortBy parameters later
}

export async function getQuestions(
  params: GetQuestionsParams,
): Promise<{ questions: QuestionWithDetails[]; totalQuestions: number }> {
  try {
    const { page = 1, pageSize = 10 } = params;
    const skipAmount = (page - 1) * pageSize;

    const questions = await prisma.question.findMany({
      include: questionIncludeArgs,
      skip: skipAmount,
      take: pageSize,
      orderBy: {
        createdAt: 'desc', // Default sort by newest
      },
    });

    const totalQuestions = await prisma.question.count(); // Get total count for pagination

    return { questions, totalQuestions };
  } catch (error) {
    console.error('Error fetching questions:', error);
    // Consider throwing a more specific error or returning a structured error object
    throw new Error('Failed to fetch questions');
  }
}

// --- Fetch Single Question ---

const questionDetailIncludeArgs = {
    ...questionIncludeArgs, // Include author, tags, counts
    answers: {
      include: answerIncludeArgs, // Include answer author and vote count
      orderBy: [
        { isAccepted: 'desc'}, // Show accepted answer first
        { votes: { _count: 'desc' } }, // Then sort by votes
        { createdAt: 'asc' }, // Then by creation time
      ],
    },
} satisfies Prisma.QuestionInclude;

export type QuestionDetail = Prisma.QuestionGetPayload<{
    include: typeof questionDetailIncludeArgs
}>;

export async function getQuestionById(questionId: string): Promise<QuestionDetail | null> {
  try {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: questionDetailIncludeArgs,
    });

    return question;
  } catch (error) {
    console.error(`Error fetching question ${questionId}:`, error);
    throw new Error('Failed to fetch question details');
  }
}
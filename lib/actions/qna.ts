// app/actions/qna.ts
"use server"; // <--- Mark this module's functions as Server Actions

import { Prisma } from "@prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma"; // Adjust path if your prisma client instance is elsewhere
import { getCurrentUser } from "@/lib/auth"; // Adjust path to your session logic (e.g., NextAuth.js helper)
import {
  CreateQuestionSchema,
  CreateQuestionInput,
  CreateAnswerSchema,
  CreateAnswerInput,
} from "@/lib/validations/qna";
import { revalidatePath } from "next/cache";
// --- Basic Types/Interfaces (Optional but helpful) ---

export type QuestionWithDetails = Prisma.QuestionGetPayload<{
  include: {
    author: { select: { id: true; name: true; image: true } };
    tags: { include: { tag: true } };
    answers: {
      orderBy: { createdAt: "asc" }; // Or sort by votes later
      include: {
        author: { select: { id: true; name: true; image: true } };
        _count: { select: { votes: true } };
        // Add user's vote later
      };
    };
    _count: { select: { votes: true; answers: true } };
    // Add user's vote later
  };
}>;

export type QuestionBasic = Prisma.QuestionGetPayload<{
  include: {
    author: { select: { id: true; name: true; image: true } };
    tags: { include: { tag: { select: { name: true; id: true } } } }; // Include tag names for list view
    _count: { select: { votes: true; answers: true } };
  };
}>;

// --- Input Schemas (for potential future use with params) ---
const GetQuestionsSchema = z.object({
  // Add pagination, sorting, filtering params later
  tag: z.string().optional(),
  sortBy: z
    .enum(["newest", "votes", "unanswered"])
    .optional()
    .default("newest"),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10),
});

// --- Server Actions ---

/**
 * Fetches a list of questions with basic details for list views.
 * @param options - Optional filtering, sorting, pagination parameters.
 */
export async function getQuestions(): Promise<{
// rawOptions?: z.input<typeof GetQuestionsSchema> // Use later when params are needed
  questions: QuestionBasic[];
  total: number;
}> {
  // Return total for pagination
  try {
    // Input validation (implement later when options are used)
    // const options = GetQuestionsSchema.parse(rawOptions || {});
    // const { page, limit, sortBy, tag } = options;
    // const skip = (page - 1) * limit;

    // Construct where clause based on filters (implement later)
    const whereClause: Prisma.QuestionWhereInput = {
      // Example: Filtering by tag
      // ...(tag && {
      //   tags: {
      //     some: {
      //       tag: {
      //         name: tag,
      //       },
      //     },
      //   },
      // }),
    };

    // Construct order by clause (implement later)
    const orderByClause: Prisma.QuestionOrderByWithRelationInput = {
      createdAt: "desc", // Default sort by newest
      // switch (sortBy) {
      //   case 'votes': orderByClause = { votes: { _count: 'desc' } }; break;
      //   // Add other sort options
      // }
    };

    const [questions, total] = await prisma.$transaction([
      prisma.question.findMany({
        where: whereClause,
        // skip: skip,
        // take: limit,
        orderBy: orderByClause,
        include: {
          author: { select: { id: true, name: true, image: true } },
          tags: { include: { tag: { select: { name: true, id: true } } } }, // Get tag names
          _count: { select: { votes: true, answers: true } }, // Count votes & answers efficiently
        },
      }),
      prisma.question.count({ where: whereClause }), // Get total count for pagination
    ]);

    return { questions, total };
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    // Consider returning a more specific error object or re-throwing
    throw new Error("Could not fetch questions.");
  }
}

/**
 * Fetches a single question by its ID with all details including answers.
 * @param questionId - The CUID of the question.
 */
export async function getQuestionById(
  questionId: string
): Promise<QuestionWithDetails | null> {
  // Validate input basic check
  if (!questionId || typeof questionId !== "string") {
    console.error("Invalid questionId provided:", questionId);
    return null; // Or throw validation error
  }

  try {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        author: { select: { id: true, name: true, image: true } },
        tags: {
          // Get tag names via the relation
          include: { tag: { select: { id: true, name: true } } },
        },
        answers: {
          orderBy: { createdAt: "asc" }, // Default order for answers
          include: {
            author: { select: { id: true, name: true, image: true } },
            _count: { select: { votes: true } },
            // Include user's vote on answers later
          },
        },
        _count: { select: { votes: true, answers: true } }, // Count votes on the question itself
        // Include user's vote on question later
      },
    });

    if (!question) {
      // Could use notFound() from next/navigation if called directly from a page
      return null;
    }

    // Here you might add logic to check if the current user has voted
    // const user = await getCurrentUser();
    // if (user) { ... query Vote model ... }

    return question;
  } catch (error) {
    console.error(`Failed to fetch question ${questionId}:`, error);
    // Consider returning a more specific error object or re-throwing
    throw new Error("Could not fetch question details.");
  }
}

export async function createQuestion(
  rawInput: CreateQuestionInput // Use the Zod inferred type directly if no FormData
): Promise<{
  success: boolean;
  questionId?: string;
  error?: string;
  fieldErrors?: z.ZodIssue[];
}> {
  const user = await getCurrentUser();
  if (!user?.id) {
    return {
      success: false,
      error: "Unauthorized: You must be logged in to ask a question.",
    };
    // Or throw new Error('Unauthorized');
  }

  // 1. Validate input using Zod schema
  const validationResult = CreateQuestionSchema.safeParse(rawInput);
  if (!validationResult.success) {
    console.error("Validation failed:", validationResult.error.issues);
    return {
      success: false,
      error: "Invalid input.",
      fieldErrors: validationResult.error.issues,
    };
  }
  const { title, content, tags } = validationResult.data;

  try {
    // 2. Handle Tags: Find existing or create new ones
    const tagOperations = tags.map((tagName) => {
      const cleanedTagName = tagName.toLowerCase().trim(); // Normalize tag name
      return prisma.tag.upsert({
        where: { name: cleanedTagName },
        update: {}, // No update needed if found
        create: { name: cleanedTagName },
      });
    });
    const createdOrFoundTags = await prisma.$transaction(tagOperations);
    const tagIds = createdOrFoundTags.map((tag) => tag.id);

    // 3. Create the Question and connect Tags in a transaction
    const newQuestion = await prisma.question.create({
      data: {
        title: title,
        content: content, // Prisma expects Json type here
        authorId: user.id,
        tags: {
          // Connect the question to the tags using the join table
          create: tagIds.map((tagId) => ({
            tag: {
              connect: { id: tagId },
            },
            // Optionally add assignedBy if tracking that:
            // assignedById: user.id
          })),
        },
      },
      select: { id: true }, // Only select the ID after creation
    });

    // 4. Revalidate paths to update caches
    revalidatePath("/app/qna"); // Revalidate the main list page
    // Consider revalidating tag-specific pages if you have them

    // 5. Return success and the new question ID
    // We'll redirect on the client-side or page component after getting the ID
    return { success: true, questionId: newQuestion.id };
  } catch (error) {
    console.error("Failed to create question:", error);
    // Check for specific Prisma errors if needed (e.g., unique constraint)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific errors, e.g., unique constraints if applicable
    }
    return {
      success: false,
      error: "Database Error: Could not create the question.",
    };
  }
}

/**
 * Creates a new answer for a specific question.
 * Requires authenticated user.
 */
export async function createAnswer(
  rawInput: CreateAnswerInput
): Promise<{
  success: boolean;
  answerId?: string;
  error?: string;
  fieldErrors?: z.ZodIssue[];
}> {
  const user = await getCurrentUser();
  if (!user?.id) {
    return {
      success: false,
      error: "Unauthorized: You must be logged in to answer.",
    };
  }

  // 1. Validate input
  const validationResult = CreateAnswerSchema.safeParse(rawInput);
  if (!validationResult.success) {
    console.error("Validation failed:", validationResult.error.issues);
    return {
      success: false,
      error: "Invalid input.",
      fieldErrors: validationResult.error.issues,
    };
  }
  const { questionId, content } = validationResult.data;

  try {
    // Optional: Check if the question exists before creating answer
    const questionExists = await prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true },
    });
    if (!questionExists) {
      return { success: false, error: "Question not found." };
    }

    // 2. Create the Answer
    const newAnswer = await prisma.answer.create({
      data: {
        content: content,
        questionId: questionId,
        authorId: user.id,
      },
      select: { id: true },
    });

    // 3. Revalidate the question detail page
    revalidatePath(`/app/qna/${questionId}`);

    return { success: true, answerId: newAnswer.id };
  } catch (error) {
    console.error(`Failed to create answer for question ${questionId}:`, error);
    return {
      success: false,
      error: "Database Error: Could not save the answer.",
    };
  }
}

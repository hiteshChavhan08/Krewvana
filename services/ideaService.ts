// services/ideaService.ts
import prisma from "@/lib/prisma";
import {
  IdeaCreateAPIData,
  IdeaUpdateAPIData,
  IdeaCommentsQueryData,
  IdeaCommentCreateData,
} from "@/lib/schemas";
import { PointLogType, Prisma, UserRole, IdeaStatus } from "@prisma/client";
import { awardPoints } from "@/lib/points";
import {
  GetAllIdeasServiceResponse,
  GetIdeaByIdServiceResponse,
  CreateIdeaServiceResponse,
  UpdateIdeaServiceResponse,
  DeleteIdeaServiceResponse,
  VoteOnIdeaServiceResponse,
  GetIdeaCommentsServiceResponse,
  CreateIdeaCommentServiceResponse,
  IdeaWithCountsAndVoteStatus,
  IdeaCommentPayload,
  ServiceErrorResponse,
} from "@/types/serviceTypes";

// Define the shape of the 'votes' relation *as returned by Prisma* with the select clause
type SelectedIdeaVote = { id: string };

// Define the accurate shape returned by Prisma given the includes used in this service
type PrismaIdeaWithIncludes = Prisma.IdeaGetPayload<{
  select: {
    // Use select at the top level for more control over the final shape
    id: true;
    title: true;
    description: true;
    category: true;
    status: true;
    createdAt: true;
    updatedAt: true;
    submittedById: true;
    submittedBy: { select: { id: true; name: true; image: true } };
    // Select the 'votes' relation, but only the 'id' field for matching user
    // Note: We handle the conditional logic (currentUserId) *after* fetching
    votes: {
      where?: { userId: string }; // Where clause is applied conditionally later
      select: { id: true };
    };
    _count: { select: { votes: true; comments: true } };
  };
}>;

// Helper function: Accepts the accurately typed Prisma result
const transformPrismaIdea = (
  // The 'idea' parameter might have votes as SelectedIdeaVote[] or just an empty array if not filtered
  idea: Omit<PrismaIdeaWithIncludes, "votes"> & { votes: SelectedIdeaVote[] }, // Type after potential filtering
  currentUserId?: string // userId is still needed to determine the boolean flag
): IdeaWithCountsAndVoteStatus => {
  // The currentUserVoted logic depends only on whether the filtered votes array is non-empty
  const currentUserVoted = idea.votes.length > 0;

  return {
    id: idea.id,
    title: idea.title,
    description: idea.description,
    category: idea.category,
    status: idea.status,
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
    submittedById: idea.submittedById,
    submittedBy: idea.submittedBy,
    currentUserVoted: currentUserVoted, // Use the calculated boolean
    voteCount: idea._count.votes,
    commentCount: idea._count.comments,
  };
};

export const ideaService = {
  async getAllIdeas(
    query: { page: number; limit: number; sortBy: string; order: string },
    currentUserId: string
  ): Promise<GetAllIdeasServiceResponse> {
    try {
      const { page, limit, sortBy, order } = query;
      const skip = (page - 1) * limit;

      // Fetch data matching the more detailed PrismaIdeaWithIncludes select structure
      const ideasRaw = await prisma.idea.findMany({
        skip,
        take: limit,
        orderBy:
          sortBy === "votes"
            ? { votes: { _count: order as "asc" | "desc" } }
            : { [sortBy]: order as "asc" | "desc" },
        select: {
          // Match the select in PrismaIdeaWithIncludes
          id: true,
          title: true,
          description: true,
          category: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          submittedById: true,
          submittedBy: { select: { id: true, name: true, image: true } },
          votes: {
            // Select only the vote ID for the specific user
            where: { userId: currentUserId },
            select: { id: true },
          },
          _count: { select: { votes: true, comments: true } },
        },
      });
      const totalIdeasCount = await prisma.idea.count();

      // Transform each raw idea (votes array will be correct based on the where clause)
      const processedIdeas = ideasRaw.map((idea) =>
        transformPrismaIdea(idea, currentUserId)
      );

      return {
        success: true,
        data: processedIdeas,
        status: 200,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalIdeasCount / limit),
          totalItems: totalIdeasCount,
        },
      };
    } catch (e: any) {
      console.error("[Service getAllIdeas] Error:", e);
      return { success: false, error: "Failed to fetch ideas.", status: 500 };
    }
  },

  async getIdeaById(
    ideaId: string,
    currentUserId?: string
  ): Promise<GetIdeaByIdServiceResponse> {
    try {
      const ideaRaw = await prisma.idea.findUnique({
        where: { id: ideaId },
        select: {
          // Match the select in PrismaIdeaWithIncludes
          id: true,
          title: true,
          description: true,
          category: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          submittedById: true,
          submittedBy: { select: { id: true, name: true, image: true } },
          votes: currentUserId // Conditionally apply the where clause here
            ? { where: { userId: currentUserId }, select: { id: true } }
            : { select: { id: true }, take: 0 }, // Select structure but return empty array if no user
          _count: { select: { votes: true, comments: true } },
        },
      });

      if (!ideaRaw) {
        return { success: true, data: null, status: 200 };
      }
      // Transform the raw idea
      const processedIdea = transformPrismaIdea(ideaRaw, currentUserId);
      return { success: true, data: processedIdea, status: 200 };
    } catch (e: any) {
      console.error(`[Service getIdeaById ${ideaId}] Error:`, e);
      return {
        success: false,
        error: "Failed to fetch idea details.",
        status: 500,
      };
    }
  },

  async createIdea(
    data: IdeaCreateAPIData,
    userId: string
  ): Promise<CreateIdeaServiceResponse> {
    try {
      const newIdea = await prisma.idea.create({
        data: { ...data, submittedById: userId, status: "SUBMITTED" },
        // Select the shape needed for transformation
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          submittedById: true,
          submittedBy: { select: { id: true, name: true, image: true } },
          // votes: // No votes needed for new idea, transformer expects empty array
          _count: { select: { votes: true, comments: true } },
        },
      });
      // Manually add empty votes array for transformer compatibility
      const processedNewIdea = transformPrismaIdea(
        { ...newIdea, votes: [] },
        userId
      );

      await awardPoints({
        userId: userId,
        actionType: PointLogType.IDEA_SUBMITTED,
        reason: `Submitted idea`,
        ideaId: newIdea.id,
      });

      return { success: true, data: processedNewIdea, status: 201 };
    } catch (e: any) {
      console.error("[Service createIdea] Error:", e);
      return { success: false, error: "Failed to create idea.", status: 500 };
    }
  },

  async updateIdea(
    ideaId: string,
    data: IdeaUpdateAPIData,
    requestingUserId: string,
    requestingUserRole: UserRole
  ): Promise<UpdateIdeaServiceResponse> {
    try {
      const ideaToUpdate = await prisma.idea.findUnique({
        where: { id: ideaId },
        select: { submittedById: true },
      });
      if (!ideaToUpdate)
        return { success: false, error: "Idea not found", status: 404 };
      if (
        ideaToUpdate.submittedById !== requestingUserId &&
        requestingUserRole !== UserRole.ADMIN
      ) {
        return { success: false, error: "Forbidden", status: 403 };
      }
      const updatePayload: Prisma.IdeaUpdateInput = {};
      if (data.title !== undefined) updatePayload.title = data.title;
      if (data.description !== undefined)
        updatePayload.description = data.description;
      if (data.category !== undefined) updatePayload.category = data.category;
      if (requestingUserRole === UserRole.ADMIN && data.status !== undefined)
        updatePayload.status = data.status;
      if (Object.keys(updatePayload).length === 0)
        return {
          success: false,
          error: "No valid fields provided for update",
          status: 400,
        };

      // Fetch updated data matching the select structure
      const updatedIdeaRaw = await prisma.idea.update({
        where: { id: ideaId },
        data: updatePayload,
        select: {
          // Match the select in PrismaIdeaWithIncludes
          id: true,
          title: true,
          description: true,
          category: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          submittedById: true,
          submittedBy: { select: { id: true, name: true, image: true } },
          votes: {
            // Select relevant user's vote after update
            where: { userId: requestingUserId },
            select: { id: true },
          },
          _count: { select: { votes: true, comments: true } },
        },
      });
      const processedIdea = transformPrismaIdea(
        updatedIdeaRaw,
        requestingUserId
      );
      return { success: true, data: processedIdea, status: 200 };
    } catch (e: any) {
      console.error(`[Service updateIdea ${ideaId}] Error:`, e);
      return { success: false, error: "Failed to update idea.", status: 500 };
    }
  },

  // --- DELETE, VOTE, COMMENTS methods remain the same ---
  async deleteIdea(
    ideaId: string,
    requestingUserId: string,
    requestingUserRole: UserRole
  ): Promise<DeleteIdeaServiceResponse> {
    try {
      const ideaToDelete = await prisma.idea.findUnique({
        where: { id: ideaId },
        select: { submittedById: true },
      });
      if (!ideaToDelete)
        return { success: false, error: "Idea not found", status: 404 };
      if (
        ideaToDelete.submittedById !== requestingUserId &&
        requestingUserRole !== UserRole.ADMIN
      ) {
        return { success: false, error: "Forbidden", status: 403 };
      }
      await prisma.idea.delete({ where: { id: ideaId } });
      return {
        success: true,
        data: { message: "Idea deleted successfully" },
        status: 200,
      };
    } catch (e: any) {
      console.error(`[Service deleteIdea ${ideaId}] Error:`, e);
      return { success: false, error: "Failed to delete idea.", status: 500 };
    }
  },

  async voteOnIdea(
    ideaId: string,
    userId: string
  ): Promise<VoteOnIdeaServiceResponse> {
    try {
      const idea = await prisma.idea.findUnique({
        where: { id: ideaId },
        select: { id: true, title: true, submittedById: true },
      });
      if (!idea)
        return { success: false, error: "Idea not found", status: 404 };
      const existingVote = await prisma.ideaVote.findUnique({
        where: { userId_ideaId: { userId, ideaId } },
      });
      let currentUserVoted: boolean;
      if (existingVote) {
        await prisma.ideaVote.delete({ where: { id: existingVote.id } });
        currentUserVoted = false;
      } else {
        const newVote = await prisma.ideaVote.create({
          data: { userId, ideaId },
        });
        currentUserVoted = true;
        if (idea.submittedById && idea.submittedById !== userId) {
          await awardPoints({
            userId: idea.submittedById,
            actionType: PointLogType.IDEA_VOTE_RECEIVED,
            reason: `Vote for idea`,
            ideaId: idea.id,
            relatedIdeaVoteId: newVote.id,
          });
        }
      }
      const updatedVoteCount = await prisma.ideaVote.count({
        where: { ideaId },
      });
      return {
        success: true,
        data: {
          message: currentUserVoted ? "Vote added" : "Vote removed",
          ideaId,
          voteCount: updatedVoteCount,
          currentUserVoted,
        },
        status: 200,
      };
    } catch (e: any) {
      console.error(`[Service voteOnIdea ${ideaId}] Error:`, e);
      return { success: false, error: "Failed to process vote.", status: 500 };
    }
  },

  async getIdeaComments(
    ideaId: string,
    query: IdeaCommentsQueryData
  ): Promise<GetIdeaCommentsServiceResponse> {
    try {
      const ideaExists = await prisma.idea.findUnique({
        where: { id: ideaId },
        select: { id: true },
      });
      if (!ideaExists)
        return { success: false, error: "Idea not found", status: 404 };
      const { page, limit, sortBy, order } = query;
      const skip = (page - 1) * limit;
      const comments: IdeaCommentPayload[] = await prisma.ideaComment.findMany({
        // Add type
        where: { ideaId },
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: { author: { select: { id: true, name: true, image: true } } },
      });
      const totalComments = await prisma.ideaComment.count({
        where: { ideaId },
      });
      return {
        success: true,
        data: comments,
        status: 200,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalComments / limit),
          totalItems: totalComments,
        },
      };
    } catch (e: any) {
      console.error(`[Service getIdeaComments ${ideaId}] Error:`, e);
      return {
        success: false,
        error: "Failed to fetch comments.",
        status: 500,
      };
    }
  },

  async createIdeaComment(
    ideaId: string,
    data: IdeaCommentCreateData,
    authorId: string
  ): Promise<CreateIdeaCommentServiceResponse> {
    try {
      const idea = await prisma.idea.findUnique({
        where: { id: ideaId },
        select: { id: true },
      });
      if (!idea)
        return { success: false, error: "Idea not found", status: 404 };
      const newComment: IdeaCommentPayload = await prisma.ideaComment.create({
        // Add type
        data: { ...data, authorId, ideaId },
        include: { author: { select: { id: true, name: true, image: true } } },
      });
      return { success: true, data: newComment, status: 201 };
    } catch (e: any) {
      console.error(`[Service createIdeaComment ${ideaId}] Error:`, e);
      return {
        success: false,
        error: "Failed to create comment.",
        status: 500,
      };
    }
  },
};

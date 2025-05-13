// /types/serviceTypes.ts
import { Prisma, IdeaStatus } from "@prisma/client"; // Import necessary Prisma types

// --- Generic Service Response Definitions ---
export type ServiceErrorResponse = {
  success: false;
  error: string;
  status: number; // HTTP status code
};

export type ServiceSuccessResponse<TData> = {
  success: true;
  data: TData;
  status: number; // HTTP status code
};

export type ServiceResponse<TData> =
  | ServiceSuccessResponse<TData>
  | ServiceErrorResponse;

export type PaginatedServiceSuccessResponse<TItem> = {
  success: true;
  data: TItem[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number; // Corrected name
  };
  status: number;
};

export type PaginatedServiceResponse<TItem> =
  | PaginatedServiceSuccessResponse<TItem>
  | ServiceErrorResponse;

// --- Specific Payload Types ---

// Idea Payloads
// Base user info included in other payloads
export type BasicUserInfo = {
  id: string;
  name: string | null;
  image: string | null;
};

// Type representing the Idea structure returned by the service/API
// after transforming Prisma result
export type IdeaWithCountsAndVoteStatus = {
  id: string;
  title: string;
  description: string;
  category: string[];
  status: IdeaStatus; // Use Prisma enum
  createdAt: Date;
  updatedAt: Date;
  submittedById: string;
  submittedBy: BasicUserInfo; // Use defined type
  currentUserVoted: boolean;
  voteCount: number;
  commentCount: number;
};

// Idea Comment Payloads
export type IdeaCommentPayload = Prisma.IdeaCommentGetPayload<{
  include: { author: { select: { id: true; name: true; image: true } } };
}>;

// --- Specific Service Response Types (Discriminated Unions) ---
export type GetAllIdeasServiceResponse =
  PaginatedServiceResponse<IdeaWithCountsAndVoteStatus>;
export type GetIdeaByIdServiceResponse =
  ServiceResponse<IdeaWithCountsAndVoteStatus | null>;
export type CreateIdeaServiceResponse =
  ServiceResponse<IdeaWithCountsAndVoteStatus>;
export type UpdateIdeaServiceResponse =
  ServiceResponse<IdeaWithCountsAndVoteStatus>;
export type DeleteIdeaServiceResponse = ServiceResponse<{ message: string }>;
export type VoteOnIdeaServiceResponse = ServiceResponse<{
  message: string;
  ideaId: string;
  voteCount: number;
  currentUserVoted: boolean;
}>;
export type GetIdeaCommentsServiceResponse =
  PaginatedServiceResponse<IdeaCommentPayload>;
export type CreateIdeaCommentServiceResponse =
  ServiceResponse<IdeaCommentPayload>;

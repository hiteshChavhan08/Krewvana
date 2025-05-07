// lib/constants.ts
import { PointLogType } from '@prisma/client';

export const POINT_VALUES: Record<PointLogType, number> = {
  // Q&A
  QUESTION_POSTED: 5, // Points for asking a question
  ANSWER_POSTED: 10,
  ANSWER_ACCEPTED_AUTHOR: 20,
  ANSWER_ACCEPTED_SELECTOR: 5,  // Points for the user who selected the answer
  QUESTION_UPVOTE_RECEIVED: 2, // Points for question author when their Q gets a vote
  ANSWER_UPVOTE_RECEIVED: 3,   // Points for answer author when their A gets a vote
  UPVOTE_GIVEN: 1,             // Points for the user who casts an upvote

  // Idea Wall
  IDEA_SUBMITTED: 15,
  IDEA_VOTE_RECEIVED: 5, // Points for idea author when their idea gets a vote

  // Learning Hub
  RESOURCE_SUBMITTED: 10,

  // Kudos
  KUDOS_GIVEN: 2,
  KUDOS_RECEIVED: 10,

  // Other
  PROFILE_COMPLETION: 25,
  MENTORSHIP_COMPLETED_MENTOR: 50,
  MENTORSHIP_COMPLETED_MENTEE: 30,
  BADGE_EARNED: 0, // Points for badges might be defined elsewhere or part of the badge itself
  // COMMENT_POSTED: 1, // If implemented
  OTHER: 0,
};

export function getPointsForAction(actionType: PointLogType): number {
  const points = POINT_VALUES[actionType];
  if (points === undefined) {
    console.warn(`[PointsSystem] No point value defined for action type: ${actionType}. Defaulting to 0.`);
    return 0;
  }
  return points;
}

// Export individual point constants for direct use if preferred
export const POINTS_QUESTION_POSTED = POINT_VALUES[PointLogType.QUESTION_POSTED];
export const POINTS_ANSWER_POSTED = POINT_VALUES[PointLogType.ANSWER_POSTED];
export const POINTS_ANSWER_ACCEPTED_AUTHOR = POINT_VALUES[PointLogType.ANSWER_ACCEPTED_AUTHOR];
export const POINTS_ANSWER_ACCEPTED_SELECTOR = POINT_VALUES[PointLogType.ANSWER_ACCEPTED_SELECTOR];
export const POINTS_QUESTION_UPVOTE_RECEIVED = POINT_VALUES[PointLogType.QUESTION_UPVOTE_RECEIVED];
export const POINTS_ANSWER_UPVOTE_RECEIVED = POINT_VALUES[PointLogType.ANSWER_UPVOTE_RECEIVED];
export const POINTS_UPVOTE_GIVEN = POINT_VALUES[PointLogType.UPVOTE_GIVEN];
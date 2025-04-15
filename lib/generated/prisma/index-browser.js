
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  emailVerified: 'emailVerified',
  image: 'image',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  passwordHash: 'passwordHash',
  role: 'role'
};

exports.Prisma.ProfileScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  bio: 'bio',
  department: 'department',
  jobTitle: 'jobTitle',
  location: 'location',
  interests: 'interests',
  skills: 'skills',
  points: 'points',
  lastLogin: 'lastLogin',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  refresh_token: 'refresh_token',
  access_token: 'access_token',
  expires_at: 'expires_at',
  token_type: 'token_type',
  scope: 'scope',
  id_token: 'id_token',
  session_state: 'session_state'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  sessionToken: 'sessionToken',
  userId: 'userId',
  expires: 'expires'
};

exports.Prisma.VerificationTokenScalarFieldEnum = {
  identifier: 'identifier',
  token: 'token',
  expires: 'expires'
};

exports.Prisma.CourseScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  source: 'source',
  url: 'url',
  imageUrl: 'imageUrl',
  difficulty: 'difficulty',
  tags: 'tags',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EnrollmentScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  courseId: 'courseId',
  status: 'status',
  progress: 'progress',
  completedAt: 'completedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WorkshopScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  startTime: 'startTime',
  endTime: 'endTime',
  location: 'location',
  meetingUrl: 'meetingUrl',
  recordingUrl: 'recordingUrl',
  presenter: 'presenter',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WorkshopRegistrationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  workshopId: 'workshopId',
  registeredAt: 'registeredAt'
};

exports.Prisma.LearningPathScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LearningPathItemScalarFieldEnum = {
  id: 'id',
  learningPathId: 'learningPathId',
  courseId: 'courseId',
  order: 'order'
};

exports.Prisma.MentorshipSessionScalarFieldEnum = {
  id: 'id',
  mentorId: 'mentorId',
  menteeId: 'menteeId',
  scheduledTime: 'scheduledTime',
  durationMinutes: 'durationMinutes',
  topic: 'topic',
  notes: 'notes',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SkillScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  ownerId: 'ownerId'
};

exports.Prisma.SkillInterestScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  skillId: 'skillId',
  level: 'level',
  createdAt: 'createdAt'
};

exports.Prisma.IdeaScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  category: 'category',
  status: 'status',
  authorId: 'authorId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VoteScalarFieldEnum = {
  id: 'id',
  ideaId: 'ideaId',
  userId: 'userId',
  type: 'type',
  createdAt: 'createdAt'
};

exports.Prisma.CommentScalarFieldEnum = {
  id: 'id',
  text: 'text',
  ideaId: 'ideaId',
  postId: 'postId',
  authorId: 'authorId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WellnessChallengeScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  type: 'type',
  goal: 'goal',
  startDate: 'startDate',
  endDate: 'endDate',
  isTeamBased: 'isTeamBased',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ChallengeParticipantScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  wellnessChallengeId: 'wellnessChallengeId',
  joinedAt: 'joinedAt',
  progress: 'progress'
};

exports.Prisma.WellnessActivityScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  duration: 'duration',
  distance: 'distance',
  steps: 'steps',
  calories: 'calories',
  date: 'date',
  source: 'source',
  createdAt: 'createdAt'
};

exports.Prisma.MoodLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  moodLevel: 'moodLevel',
  notes: 'notes',
  date: 'date'
};

exports.Prisma.GroupScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  type: 'type',
  isPublic: 'isPublic',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GroupMemberScalarFieldEnum = {
  id: 'id',
  groupId: 'groupId',
  userId: 'userId',
  role: 'role',
  joinedAt: 'joinedAt'
};

exports.Prisma.PostScalarFieldEnum = {
  id: 'id',
  title: 'title',
  content: 'content',
  authorId: 'authorId',
  groupId: 'groupId',
  isAnnouncement: 'isAnnouncement',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.KnowledgeBaseArticleScalarFieldEnum = {
  id: 'id',
  title: 'title',
  content: 'content',
  slug: 'slug',
  category: 'category',
  tags: 'tags',
  authorId: 'authorId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RecognitionScalarFieldEnum = {
  id: 'id',
  giverId: 'giverId',
  recipientId: 'recipientId',
  message: 'message',
  valueTag: 'valueTag',
  points: 'points',
  badgeId: 'badgeId',
  isPublic: 'isPublic',
  createdAt: 'createdAt'
};

exports.Prisma.BadgeScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  imageUrl: 'imageUrl',
  criteria: 'criteria',
  createdAt: 'createdAt'
};

exports.Prisma.UserBadgeScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  badgeId: 'badgeId',
  earnedAt: 'earnedAt',
  recognitionId: 'recognitionId'
};

exports.Prisma.RewardItemScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  imageUrl: 'imageUrl',
  pointsCost: 'pointsCost',
  stock: 'stock',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RedemptionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  itemId: 'itemId',
  pointsSpent: 'pointsSpent',
  status: 'status',
  redeemedAt: 'redeemedAt',
  fulfilledAt: 'fulfilledAt'
};

exports.Prisma.InnovationChallengeScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  theme: 'theme',
  startDate: 'startDate',
  endDate: 'endDate',
  judgingCriteria: 'judgingCriteria',
  prize: 'prize',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ChallengeSubmissionScalarFieldEnum = {
  id: 'id',
  challengeId: 'challengeId',
  submitterId: 'submitterId',
  teamName: 'teamName',
  ideaId: 'ideaId',
  submissionText: 'submissionText',
  submittedAt: 'submittedAt',
  score: 'score',
  isWinner: 'isWinner'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  recipientId: 'recipientId',
  senderId: 'senderId',
  type: 'type',
  message: 'message',
  link: 'link',
  isRead: 'isRead',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.Role = exports.$Enums.Role = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER'
};

exports.VoteType = exports.$Enums.VoteType = {
  UP: 'UP',
  DOWN: 'DOWN'
};

exports.GroupType = exports.$Enums.GroupType = {
  INTEREST: 'INTEREST',
  PROJECT: 'PROJECT',
  TEAM: 'TEAM'
};

exports.GroupRole = exports.$Enums.GroupRole = {
  MEMBER: 'MEMBER',
  ADMIN: 'ADMIN'
};

exports.NotificationType = exports.$Enums.NotificationType = {
  RECOGNITION_RECEIVED: 'RECOGNITION_RECEIVED',
  NEW_COURSE_AVAILABLE: 'NEW_COURSE_AVAILABLE',
  WORKSHOP_REMINDER: 'WORKSHOP_REMINDER',
  MENTION_IN_COMMENT: 'MENTION_IN_COMMENT',
  MENTION_IN_POST: 'MENTION_IN_POST',
  IDEA_VOTED: 'IDEA_VOTED',
  IDEA_COMMENTED: 'IDEA_COMMENTED',
  CHALLENGE_STARTING: 'CHALLENGE_STARTING',
  CHALLENGE_ENDING: 'CHALLENGE_ENDING',
  NEW_ANNOUNCEMENT: 'NEW_ANNOUNCEMENT',
  GROUP_INVITE: 'GROUP_INVITE',
  REWARD_REDEEMED: 'REWARD_REDEEMED',
  BADGE_EARNED: 'BADGE_EARNED'
};

exports.Prisma.ModelName = {
  User: 'User',
  Profile: 'Profile',
  Account: 'Account',
  Session: 'Session',
  VerificationToken: 'VerificationToken',
  Course: 'Course',
  Enrollment: 'Enrollment',
  Workshop: 'Workshop',
  WorkshopRegistration: 'WorkshopRegistration',
  LearningPath: 'LearningPath',
  LearningPathItem: 'LearningPathItem',
  MentorshipSession: 'MentorshipSession',
  Skill: 'Skill',
  SkillInterest: 'SkillInterest',
  Idea: 'Idea',
  Vote: 'Vote',
  Comment: 'Comment',
  WellnessChallenge: 'WellnessChallenge',
  ChallengeParticipant: 'ChallengeParticipant',
  WellnessActivity: 'WellnessActivity',
  MoodLog: 'MoodLog',
  Group: 'Group',
  GroupMember: 'GroupMember',
  Post: 'Post',
  KnowledgeBaseArticle: 'KnowledgeBaseArticle',
  Recognition: 'Recognition',
  Badge: 'Badge',
  UserBadge: 'UserBadge',
  RewardItem: 'RewardItem',
  Redemption: 'Redemption',
  InnovationChallenge: 'InnovationChallenge',
  ChallengeSubmission: 'ChallengeSubmission',
  Notification: 'Notification'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)

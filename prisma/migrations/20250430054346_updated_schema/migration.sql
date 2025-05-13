-- CreateEnum
CREATE TYPE "PointLogType" AS ENUM ('KUDOS_GIVEN', 'KUDOS_RECEIVED', 'ANSWER_ACCEPTED_AUTHOR', 'ANSWER_ACCEPTED_SELECTOR', 'QUESTION_UPVOTE', 'ANSWER_UPVOTE', 'PROFILE_COMPLETION', 'MENTORSHIP_COMPLETED_MENTOR', 'MENTORSHIP_COMPLETED_MENTEE', 'BADGE_EARNED', 'IDEA_SUBMITTED', 'RESOURCE_SUBMITTED', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('KUDOS_RECEIVED', 'ANSWER_ON_QUESTION', 'QUESTION_ACCEPTED_ANSWER', 'MENTORSHIP_REQUEST_RECEIVED', 'MENTORSHIP_REQUEST_ACCEPTED', 'MENTORSHIP_MEMBER_JOINED', 'MENTORSHIP_CIRCLE_STARTING', 'BADGE_EARNED', 'AMA_QUESTION_ANSWERED', 'NEW_COMMENT', 'OTHER');

-- DropForeignKey
ALTER TABLE "MentorshipCircle" DROP CONSTRAINT "MentorshipCircle_skillId_fkey";

-- AlterTable
ALTER TABLE "AMAQuestion" ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PointLog" ADD COLUMN     "badgeId" TEXT,
ADD COLUMN     "type" "PointLogType",
ALTER COLUMN "reason" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "positionId" TEXT;

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSkill" (
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proficiency" INTEGER,

    CONSTRAINT "UserSkill_pkey" PRIMARY KEY ("userId","skillId")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kudosId" TEXT,
    "answerId" TEXT,
    "questionId" TEXT,
    "amaQuestionId" TEXT,
    "badgeId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Position_name_key" ON "Position"("name");

-- CreateIndex
CREATE INDEX "Position_name_idx" ON "Position"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE INDEX "Skill_name_idx" ON "Skill"("name");

-- CreateIndex
CREATE INDEX "Skill_category_idx" ON "Skill"("category");

-- CreateIndex
CREATE INDEX "UserSkill_skillId_idx" ON "UserSkill"("skillId");

-- CreateIndex
CREATE INDEX "UserSkill_userId_idx" ON "UserSkill"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AMAQuestion_isApproved_idx" ON "AMAQuestion"("isApproved");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "PointLog_badgeId_idx" ON "PointLog"("badgeId");

-- CreateIndex
CREATE INDEX "PointLog_type_idx" ON "PointLog"("type");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "User_positionId_idx" ON "User"("positionId");

-- CreateIndex
CREATE INDEX "User_points_idx" ON "User"("points");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointLog" ADD CONSTRAINT "PointLog_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipCircle" ADD CONSTRAINT "MentorshipCircle_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "MentorshipSkill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_kudosId_fkey" FOREIGN KEY ("kudosId") REFERENCES "Kudos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_amaQuestionId_fkey" FOREIGN KEY ("amaQuestionId") REFERENCES "AMAQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

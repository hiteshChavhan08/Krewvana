/*
  Warnings:

  - The values [QUESTION_UPVOTE,ANSWER_UPVOTE] on the enum `PointLogType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[postedAnswerId]` on the table `PointLog` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[relatedVoteId]` on the table `PointLog` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PointLogType_new" AS ENUM ('KUDOS_GIVEN', 'KUDOS_RECEIVED', 'ANSWER_POSTED', 'ANSWER_ACCEPTED_AUTHOR', 'ANSWER_ACCEPTED_SELECTOR', 'QUESTION_UPVOTE_RECEIVED', 'ANSWER_UPVOTE_RECEIVED', 'UPVOTE_GIVEN', 'PROFILE_COMPLETION', 'MENTORSHIP_COMPLETED_MENTOR', 'MENTORSHIP_COMPLETED_MENTEE', 'BADGE_EARNED', 'IDEA_SUBMITTED', 'RESOURCE_SUBMITTED', 'OTHER');
ALTER TABLE "PointLog" ALTER COLUMN "type" TYPE "PointLogType_new" USING ("type"::text::"PointLogType_new");
ALTER TYPE "PointLogType" RENAME TO "PointLogType_old";
ALTER TYPE "PointLogType_new" RENAME TO "PointLogType";
DROP TYPE "PointLogType_old";
COMMIT;

-- DropIndex
DROP INDEX "PointLog_acceptedAnswerId_idx";

-- DropIndex
DROP INDEX "PointLog_badgeId_idx";

-- DropIndex
DROP INDEX "PointLog_kudosId_idx";

-- AlterTable
ALTER TABLE "PointLog" ADD COLUMN     "postedAnswerId" TEXT,
ADD COLUMN     "relatedVoteId" TEXT;

-- AlterTable
ALTER TABLE "Vote" ADD COLUMN     "pointLogId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PointLog_postedAnswerId_key" ON "PointLog"("postedAnswerId");

-- CreateIndex
CREATE UNIQUE INDEX "PointLog_relatedVoteId_key" ON "PointLog"("relatedVoteId");

-- CreateIndex
CREATE INDEX "PointLog_postedAnswerId_idx" ON "PointLog"("postedAnswerId");

-- CreateIndex
CREATE INDEX "PointLog_relatedVoteId_idx" ON "PointLog"("relatedVoteId");

-- AddForeignKey
ALTER TABLE "PointLog" ADD CONSTRAINT "PointLog_postedAnswerId_fkey" FOREIGN KEY ("postedAnswerId") REFERENCES "Answer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointLog" ADD CONSTRAINT "PointLog_relatedVoteId_fkey" FOREIGN KEY ("relatedVoteId") REFERENCES "Vote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_pointLogId_fkey" FOREIGN KEY ("pointLogId") REFERENCES "PointLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PointLogType" ADD VALUE 'QUESTION_POSTED';
ALTER TYPE "PointLogType" ADD VALUE 'IDEA_VOTE_RECEIVED';

-- AlterTable
ALTER TABLE "PointLog" ADD COLUMN     "ideaId" TEXT,
ADD COLUMN     "learningResourceId" TEXT;

-- CreateIndex
CREATE INDEX "PointLog_ideaId_idx" ON "PointLog"("ideaId");

-- CreateIndex
CREATE INDEX "PointLog_learningResourceId_idx" ON "PointLog"("learningResourceId");

-- AddForeignKey
ALTER TABLE "PointLog" ADD CONSTRAINT "PointLog_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointLog" ADD CONSTRAINT "PointLog_learningResourceId_fkey" FOREIGN KEY ("learningResourceId") REFERENCES "LearningResource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

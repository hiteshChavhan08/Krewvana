-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'IDEA_STATUS_UPDATED';
ALTER TYPE "NotificationType" ADD VALUE 'IDEA_NEW_COMMENT';
ALTER TYPE "NotificationType" ADD VALUE 'IDEA_VOTE_RECEIVED_AUTHOR';
ALTER TYPE "NotificationType" ADD VALUE 'IDEA_COMMENT_MENTION';
ALTER TYPE "NotificationType" ADD VALUE 'IDEA_COMMENT_REPLY';

-- AlterEnum
ALTER TYPE "PointLogType" ADD VALUE 'IDEA_COMMENT_POSTED';

-- DropForeignKey
ALTER TABLE "Idea" DROP CONSTRAINT "Idea_submittedById_fkey";

-- DropForeignKey
ALTER TABLE "IdeaVote" DROP CONSTRAINT "IdeaVote_ideaId_fkey";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "ideaCommentId" TEXT,
ADD COLUMN     "ideaId" TEXT;

-- AlterTable
ALTER TABLE "PointLog" ADD COLUMN     "relatedIdeaCommentId" TEXT;

-- CreateTable
CREATE TABLE "IdeaComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "IdeaComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IdeaComment_authorId_idx" ON "IdeaComment"("authorId");

-- CreateIndex
CREATE INDEX "IdeaComment_ideaId_createdAt_idx" ON "IdeaComment"("ideaId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "IdeaComment_parentId_idx" ON "IdeaComment"("parentId");

-- CreateIndex
CREATE INDEX "Idea_submittedById_idx" ON "Idea"("submittedById");

-- CreateIndex
CREATE INDEX "Notification_ideaId_idx" ON "Notification"("ideaId");

-- CreateIndex
CREATE INDEX "Notification_ideaCommentId_idx" ON "Notification"("ideaCommentId");

-- CreateIndex
CREATE INDEX "PointLog_relatedIdeaCommentId_idx" ON "PointLog"("relatedIdeaCommentId");

-- AddForeignKey
ALTER TABLE "PointLog" ADD CONSTRAINT "PointLog_relatedIdeaCommentId_fkey" FOREIGN KEY ("relatedIdeaCommentId") REFERENCES "IdeaComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_ideaCommentId_fkey" FOREIGN KEY ("ideaCommentId") REFERENCES "IdeaComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaVote" ADD CONSTRAINT "IdeaVote_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaComment" ADD CONSTRAINT "IdeaComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaComment" ADD CONSTRAINT "IdeaComment_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaComment" ADD CONSTRAINT "IdeaComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "IdeaComment"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

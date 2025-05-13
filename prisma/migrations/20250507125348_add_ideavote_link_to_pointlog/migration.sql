-- AlterTable
ALTER TABLE "PointLog" ADD COLUMN     "relatedIdeaVoteId" TEXT;

-- CreateIndex
CREATE INDEX "PointLog_relatedIdeaVoteId_idx" ON "PointLog"("relatedIdeaVoteId");

-- AddForeignKey
ALTER TABLE "PointLog" ADD CONSTRAINT "PointLog_relatedIdeaVoteId_fkey" FOREIGN KEY ("relatedIdeaVoteId") REFERENCES "IdeaVote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

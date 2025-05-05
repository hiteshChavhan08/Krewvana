-- DropIndex
DROP INDEX "PointLog_relatedVoteId_key";

-- CreateIndex
CREATE INDEX "PointLog_acceptedAnswerId_idx" ON "PointLog"("acceptedAnswerId");

-- CreateIndex
CREATE INDEX "PointLog_badgeId_idx" ON "PointLog"("badgeId");

-- CreateIndex
CREATE INDEX "PointLog_kudosId_idx" ON "PointLog"("kudosId");

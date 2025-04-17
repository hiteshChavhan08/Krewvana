-- CreateEnum
CREATE TYPE "ShoutoutType" AS ENUM ('TEAM_WIN', 'PROJECT_MILESTONE', 'WORK_ANNIVERSARY', 'LIFE_MILESTONE', 'ACTIVITY_HIGHLIGHT', 'GENERAL_PRAISE', 'OTHER');

-- CreateTable
CREATE TABLE "Shoutout" (
    "id" TEXT NOT NULL,
    "type" "ShoutoutType" NOT NULL,
    "message" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "relatedUserId" TEXT,
    "submittedById" TEXT NOT NULL,

    CONSTRAINT "Shoutout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shoutout_createdAt_idx" ON "Shoutout"("createdAt");

-- CreateIndex
CREATE INDEX "Shoutout_type_idx" ON "Shoutout"("type");

-- CreateIndex
CREATE INDEX "Shoutout_relatedUserId_idx" ON "Shoutout"("relatedUserId");

-- AddForeignKey
ALTER TABLE "Shoutout" ADD CONSTRAINT "Shoutout_relatedUserId_fkey" FOREIGN KEY ("relatedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shoutout" ADD CONSTRAINT "Shoutout_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

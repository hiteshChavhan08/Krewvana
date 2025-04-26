/*
  Warnings:

  - Changed the type of `content` on the `Answer` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `content` on the `Question` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Answer" DROP COLUMN "content",
ADD COLUMN     "content" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "content",
ADD COLUMN     "content" JSONB NOT NULL;

-- CreateIndex
CREATE INDEX "Answer_isAccepted_idx" ON "Answer"("isAccepted");

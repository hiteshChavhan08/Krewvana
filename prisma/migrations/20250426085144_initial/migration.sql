/*
  Warnings:

  - You are about to drop the column `isApproved` on the `AMAQuestion` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "AMAQuestion_isApproved_idx";

-- AlterTable
ALTER TABLE "AMAQuestion" DROP COLUMN "isApproved";

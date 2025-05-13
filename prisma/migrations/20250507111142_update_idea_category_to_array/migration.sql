/*
  Warnings:

  - The `category` column on the `Idea` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Idea" DROP COLUMN "category",
ADD COLUMN     "category" TEXT[] DEFAULT ARRAY[]::TEXT[];

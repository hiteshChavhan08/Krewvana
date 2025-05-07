-- CreateEnum
CREATE TYPE "KudosCategory" AS ENUM ('TEAMWORK', 'INNOVATION', 'CUSTOMER_FOCUS', 'EXTRA_MILE', 'MENTORSHIP', 'LEADERSHIP', 'POSITIVE_ATTITUDE', 'PROBLEM_SOLVING', 'OTHER');

-- CreateTable
CREATE TABLE "KudosAppreciationCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KudosAppreciationCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KudosLike" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "kudosId" TEXT NOT NULL,

    CONSTRAINT "KudosLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KudosComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,
    "kudosId" TEXT NOT NULL,

    CONSTRAINT "KudosComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KudosCategoryLink" (
    "kudosId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KudosCategoryLink_pkey" PRIMARY KEY ("kudosId","categoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "KudosAppreciationCategory_name_key" ON "KudosAppreciationCategory"("name");

-- CreateIndex
CREATE INDEX "KudosAppreciationCategory_name_idx" ON "KudosAppreciationCategory"("name");

-- CreateIndex
CREATE INDEX "KudosLike_kudosId_idx" ON "KudosLike"("kudosId");

-- CreateIndex
CREATE INDEX "KudosLike_userId_idx" ON "KudosLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "KudosLike_userId_kudosId_key" ON "KudosLike"("userId", "kudosId");

-- CreateIndex
CREATE INDEX "KudosComment_kudosId_createdAt_idx" ON "KudosComment"("kudosId", "createdAt");

-- CreateIndex
CREATE INDEX "KudosComment_authorId_idx" ON "KudosComment"("authorId");

-- CreateIndex
CREATE INDEX "KudosCategoryLink_categoryId_idx" ON "KudosCategoryLink"("categoryId");

-- CreateIndex
CREATE INDEX "KudosCategoryLink_kudosId_idx" ON "KudosCategoryLink"("kudosId");

-- AddForeignKey
ALTER TABLE "KudosLike" ADD CONSTRAINT "KudosLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KudosLike" ADD CONSTRAINT "KudosLike_kudosId_fkey" FOREIGN KEY ("kudosId") REFERENCES "Kudos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KudosComment" ADD CONSTRAINT "KudosComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KudosComment" ADD CONSTRAINT "KudosComment_kudosId_fkey" FOREIGN KEY ("kudosId") REFERENCES "Kudos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KudosCategoryLink" ADD CONSTRAINT "KudosCategoryLink_kudosId_fkey" FOREIGN KEY ("kudosId") REFERENCES "Kudos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KudosCategoryLink" ADD CONSTRAINT "KudosCategoryLink_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "KudosAppreciationCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

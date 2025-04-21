-- CreateEnum
CREATE TYPE "MentorshipCircleStatus" AS ENUM ('PROPOSED', 'PENDING_APPROVAL', 'FORMING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MentorshipRole" AS ENUM ('MENTOR', 'MENTEE');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'DECLINED', 'REMOVED', 'LEFT');

-- CreateTable
CREATE TABLE "MentorshipSkill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorshipSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorshipCircle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "MentorshipCircleStatus" NOT NULL DEFAULT 'FORMING',
    "maxMentees" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "skillId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "MentorshipCircle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorshipCircleMember" (
    "id" TEXT NOT NULL,
    "role" "MentorshipRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "circleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "MentorshipCircleMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MentorshipSkill_name_key" ON "MentorshipSkill"("name");

-- CreateIndex
CREATE INDEX "MentorshipSkill_name_idx" ON "MentorshipSkill"("name");

-- CreateIndex
CREATE INDEX "MentorshipCircle_status_idx" ON "MentorshipCircle"("status");

-- CreateIndex
CREATE INDEX "MentorshipCircle_skillId_idx" ON "MentorshipCircle"("skillId");

-- CreateIndex
CREATE INDEX "MentorshipCircle_creatorId_idx" ON "MentorshipCircle"("creatorId");

-- CreateIndex
CREATE INDEX "MentorshipCircleMember_userId_idx" ON "MentorshipCircleMember"("userId");

-- CreateIndex
CREATE INDEX "MentorshipCircleMember_circleId_idx" ON "MentorshipCircleMember"("circleId");

-- CreateIndex
CREATE INDEX "MentorshipCircleMember_status_idx" ON "MentorshipCircleMember"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MentorshipCircleMember_circleId_userId_key" ON "MentorshipCircleMember"("circleId", "userId");

-- AddForeignKey
ALTER TABLE "MentorshipCircle" ADD CONSTRAINT "MentorshipCircle_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "MentorshipSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipCircle" ADD CONSTRAINT "MentorshipCircle_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipCircleMember" ADD CONSTRAINT "MentorshipCircleMember_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "MentorshipCircle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipCircleMember" ADD CONSTRAINT "MentorshipCircleMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

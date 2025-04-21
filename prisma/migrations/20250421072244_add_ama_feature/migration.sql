-- CreateEnum
CREATE TYPE "AMASessionStatus" AS ENUM ('UPCOMING', 'LIVE', 'ENDED', 'CANCELLED');

-- CreateTable
CREATE TABLE "AMASession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "AMASessionStatus" NOT NULL DEFAULT 'UPCOMING',
    "isTechSpecific" BOOLEAN NOT NULL DEFAULT false,
    "topic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hostId" TEXT NOT NULL,

    CONSTRAINT "AMASession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AMAQuestion" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "answerText" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sessionId" TEXT NOT NULL,
    "submittedById" TEXT,
    "answeredById" TEXT,

    CONSTRAINT "AMAQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AMASession_status_idx" ON "AMASession"("status");

-- CreateIndex
CREATE INDEX "AMASession_scheduledAt_idx" ON "AMASession"("scheduledAt");

-- CreateIndex
CREATE INDEX "AMASession_hostId_idx" ON "AMASession"("hostId");

-- CreateIndex
CREATE INDEX "AMAQuestion_sessionId_idx" ON "AMAQuestion"("sessionId");

-- CreateIndex
CREATE INDEX "AMAQuestion_submittedById_idx" ON "AMAQuestion"("submittedById");

-- CreateIndex
CREATE INDEX "AMAQuestion_isApproved_idx" ON "AMAQuestion"("isApproved");

-- CreateIndex
CREATE INDEX "AMAQuestion_answeredAt_idx" ON "AMAQuestion"("answeredAt");

-- AddForeignKey
ALTER TABLE "AMASession" ADD CONSTRAINT "AMASession_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AMAQuestion" ADD CONSTRAINT "AMAQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AMASession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AMAQuestion" ADD CONSTRAINT "AMAQuestion_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AMAQuestion" ADD CONSTRAINT "AMAQuestion_answeredById_fkey" FOREIGN KEY ("answeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

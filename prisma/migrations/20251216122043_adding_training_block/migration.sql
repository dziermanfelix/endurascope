-- CreateTable
CREATE TABLE "training_blocks" (
    "id" TEXT NOT NULL,
    "raceName" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "raceDate" TIMESTAMP(3) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "durationWeeks" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "training_blocks_raceDate_idx" ON "training_blocks"("raceDate");

-- CreateIndex
CREATE INDEX "training_blocks_startDate_idx" ON "training_blocks"("startDate");

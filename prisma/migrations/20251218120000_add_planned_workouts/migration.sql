-- AlterTable
ALTER TABLE "training_blocks" ADD COLUMN "goalTime" TEXT,
ADD COLUMN "goalDescription" TEXT;

-- CreateTable
CREATE TABLE "planned_workouts" (
    "id" TEXT NOT NULL,
    "trainingBlockId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "dayCode" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "story" TEXT,
    "plannedMiles" DOUBLE PRECISION,
    "workoutType" TEXT,
    "expectedActivityName" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "activityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planned_workouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "planned_workouts_trainingBlockId_idx" ON "planned_workouts"("trainingBlockId");

-- CreateIndex
CREATE INDEX "planned_workouts_scheduledDate_idx" ON "planned_workouts"("scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "planned_workouts_trainingBlockId_weekNumber_dayCode_key" ON "planned_workouts"("trainingBlockId", "weekNumber", "dayCode");

-- AddForeignKey
ALTER TABLE "planned_workouts" ADD CONSTRAINT "planned_workouts_trainingBlockId_fkey" FOREIGN KEY ("trainingBlockId") REFERENCES "training_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_workouts" ADD CONSTRAINT "planned_workouts_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

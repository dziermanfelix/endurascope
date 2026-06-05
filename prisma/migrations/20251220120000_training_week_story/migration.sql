-- CreateTable
CREATE TABLE "training_weeks" (
    "id" TEXT NOT NULL,
    "trainingBlockId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "story" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_weeks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "training_weeks_trainingBlockId_idx" ON "training_weeks"("trainingBlockId");

-- CreateIndex
CREATE UNIQUE INDEX "training_weeks_trainingBlockId_weekNumber_key" ON "training_weeks"("trainingBlockId", "weekNumber");

-- AddForeignKey
ALTER TABLE "training_weeks" ADD CONSTRAINT "training_weeks_trainingBlockId_fkey" FOREIGN KEY ("trainingBlockId") REFERENCES "training_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate per-week story from first non-null planned_workouts.story in each week
INSERT INTO "training_weeks" ("id", "trainingBlockId", "weekNumber", "story", "updatedAt")
SELECT
    gen_random_uuid()::text,
    pw."trainingBlockId",
    pw."weekNumber",
    (
        SELECT pw2."story"
        FROM "planned_workouts" pw2
        WHERE pw2."trainingBlockId" = pw."trainingBlockId"
          AND pw2."weekNumber" = pw."weekNumber"
          AND pw2."story" IS NOT NULL
          AND TRIM(pw2."story") <> ''
        ORDER BY pw2."sortOrder" ASC
        LIMIT 1
    ),
    CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT "trainingBlockId", "weekNumber"
    FROM "planned_workouts"
) pw;

-- AlterTable
ALTER TABLE "planned_workouts" DROP COLUMN "story";

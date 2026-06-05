-- DropForeignKey
ALTER TABLE "planned_workouts" DROP CONSTRAINT IF EXISTS "planned_workouts_activityId_fkey";

-- AlterTable
ALTER TABLE "planned_workouts" DROP COLUMN IF EXISTS "activityId";
ALTER TABLE "planned_workouts" DROP COLUMN IF EXISTS "expectedActivityName";
ALTER TABLE "activities" DROP COLUMN IF EXISTS "movingTime";

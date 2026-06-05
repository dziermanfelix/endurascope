-- CreateEnum
CREATE TYPE "PlannedWorkoutType" AS ENUM ('easy', 'workout', 'long');

-- AlterTable
ALTER TABLE "planned_workouts" ALTER COLUMN "workoutType" DROP DEFAULT;
ALTER TABLE "planned_workouts" ALTER COLUMN "workoutType" TYPE "PlannedWorkoutType" USING (
  CASE
    WHEN "workoutType" IS NULL THEN NULL
    WHEN LOWER(TRIM("workoutType")) = 'easy' THEN 'easy'::"PlannedWorkoutType"
    WHEN LOWER(TRIM("workoutType")) = 'workout' THEN 'workout'::"PlannedWorkoutType"
    WHEN LOWER(TRIM("workoutType")) = 'long' THEN 'long'::"PlannedWorkoutType"
    ELSE NULL
  END
);

-- Rename averageHeartrate to averageHeartRate
ALTER TABLE "activities" RENAME COLUMN "averageHeartrate" TO "averageHeartRate";

-- Drop unused columns
ALTER TABLE "activities" DROP COLUMN "timezone";
ALTER TABLE "activities" DROP COLUMN "utcOffset";
ALTER TABLE "activities" DROP COLUMN "workoutType";
ALTER TABLE "activities" DROP COLUMN "uploadId";
ALTER TABLE "activities" DROP COLUMN "externalId";




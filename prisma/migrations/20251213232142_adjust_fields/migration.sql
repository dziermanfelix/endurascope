/*
  Warnings:

  - You are about to drop the column `achievementCount` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `athleteCount` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `commentCount` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `commute` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `flagged` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `kudosCount` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `locationCity` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `locationCountry` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `locationState` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `manual` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `photoCount` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `private` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `trainer` on the `activities` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "activities" DROP COLUMN "achievementCount",
DROP COLUMN "athleteCount",
DROP COLUMN "commentCount",
DROP COLUMN "commute",
DROP COLUMN "flagged",
DROP COLUMN "kudosCount",
DROP COLUMN "locationCity",
DROP COLUMN "locationCountry",
DROP COLUMN "locationState",
DROP COLUMN "manual",
DROP COLUMN "photoCount",
DROP COLUMN "private",
DROP COLUMN "trainer";

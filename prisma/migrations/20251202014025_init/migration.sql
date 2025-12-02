-- CreateTable
CREATE TABLE "strava_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "tokenType" TEXT NOT NULL DEFAULT 'Bearer',
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strava_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "stravaId" BIGINT NOT NULL,
    "name" TEXT,
    "distance" DOUBLE PRECISION DEFAULT 0,
    "movingTime" INTEGER DEFAULT 0,
    "elapsedTime" INTEGER DEFAULT 0,
    "totalElevationGain" DOUBLE PRECISION DEFAULT 0,
    "type" TEXT,
    "startDate" TIMESTAMP(3),
    "startDateLocal" TIMESTAMP(3),
    "timezone" TEXT,
    "utcOffset" INTEGER,
    "locationCity" TEXT,
    "locationState" TEXT,
    "locationCountry" TEXT,
    "achievementCount" INTEGER DEFAULT 0,
    "kudosCount" INTEGER DEFAULT 0,
    "commentCount" INTEGER DEFAULT 0,
    "athleteCount" INTEGER DEFAULT 0,
    "photoCount" INTEGER DEFAULT 0,
    "trainer" BOOLEAN DEFAULT false,
    "commute" BOOLEAN DEFAULT false,
    "manual" BOOLEAN DEFAULT false,
    "private" BOOLEAN DEFAULT false,
    "flagged" BOOLEAN DEFAULT false,
    "workoutType" INTEGER,
    "uploadId" BIGINT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "strava_tokens_userId_key" ON "strava_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "activities_stravaId_key" ON "activities"("stravaId");

-- CreateIndex
CREATE INDEX "activities_stravaId_idx" ON "activities"("stravaId");

-- CreateIndex
CREATE INDEX "activities_startDate_idx" ON "activities"("startDate");

-- CreateIndex
CREATE INDEX "activities_type_idx" ON "activities"("type");

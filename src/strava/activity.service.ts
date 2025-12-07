import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StravaActivity, StravaService } from './strava.service';

@Injectable()
export class ActivityService {
  constructor(
    private prisma: PrismaService,
    private stravaService: StravaService
  ) {}

  async saveActivities(activities: StravaActivity[]): Promise<void> {
    if (activities.length === 0) {
      return;
    }

    for (const activity of activities) {
      try {
        // Fetch detailed activity info to get calories, heart rate, and other detailed fields
        // The list endpoint doesn't include these fields
        let detailedActivity: StravaActivity | null = null;
        let activityType = activity.type || null;

        try {
          detailedActivity = await this.stravaService.getActivityById(activity.id);
          // Use sport_type if available and different from "Workout"
          if (detailedActivity.sport_type && detailedActivity.sport_type !== 'Workout') {
            activityType = detailedActivity.sport_type;
          }
          // Use detailed activity data for calories, heart rate, and speed
          activity.average_heartrate = detailedActivity.average_heartrate ?? activity.average_heartrate;
          activity.calories = detailedActivity.calories ?? activity.calories;
          activity.average_speed = detailedActivity.average_speed ?? activity.average_speed;
        } catch (error) {
          // If fetching detailed info fails, just use the original activity data
          console.warn(`Failed to fetch detailed info for activity ${activity.id}, using summary data only`);
        }

        await this.prisma.activity.upsert({
          where: { stravaId: BigInt(activity.id) },
          create: {
            stravaId: BigInt(activity.id),
            name: activity.name || null,
            distance: activity.distance ? activity.distance / 1000 : null, // Convert to km
            movingTime: activity.moving_time || null,
            elapsedTime: activity.elapsed_time || null,
            totalElevationGain: activity.total_elevation_gain || null,
            averageHeartrate: activity.average_heartrate || null,
            calories: activity.calories || null,
            averageSpeed: activity.average_speed || null,
            type: activityType,
            startDate: activity.start_date ? new Date(activity.start_date) : null,
            startDateLocal: activity.start_date_local ? new Date(activity.start_date_local) : null,
            timezone: activity.timezone || null,
            utcOffset: activity.utc_offset || null,
            locationCity: activity.location_city || null,
            locationState: activity.location_state || null,
            locationCountry: activity.location_country || null,
            achievementCount: activity.achievement_count || null,
            kudosCount: activity.kudos_count || null,
            commentCount: activity.comment_count || null,
            athleteCount: activity.athlete_count || null,
            photoCount: activity.photo_count || null,
            trainer: activity.trainer || false,
            commute: activity.commute || false,
            manual: activity.manual || false,
            private: activity.private || false,
            flagged: activity.flagged || false,
            workoutType: activity.workout_type || null,
            uploadId: activity.upload_id ? BigInt(activity.upload_id) : null,
            externalId: activity.external_id || null,
          },
          update: {
            name: activity.name || null,
            distance: activity.distance ? activity.distance / 1000 : null,
            movingTime: activity.moving_time || null,
            elapsedTime: activity.elapsed_time || null,
            totalElevationGain: activity.total_elevation_gain || null,
            averageHeartrate: activity.average_heartrate || null,
            calories: activity.calories || null,
            averageSpeed: activity.average_speed || null,
            type: activityType,
            startDate: activity.start_date ? new Date(activity.start_date) : null,
            startDateLocal: activity.start_date_local ? new Date(activity.start_date_local) : null,
            timezone: activity.timezone || null,
            utcOffset: activity.utc_offset || null,
            locationCity: activity.location_city || null,
            locationState: activity.location_state || null,
            locationCountry: activity.location_country || null,
            achievementCount: activity.achievement_count || null,
            kudosCount: activity.kudos_count || null,
            commentCount: activity.comment_count || null,
            athleteCount: activity.athlete_count || null,
            photoCount: activity.photo_count || null,
            trainer: activity.trainer || false,
            commute: activity.commute || false,
            manual: activity.manual || false,
            private: activity.private || false,
            flagged: activity.flagged || false,
            workoutType: activity.workout_type || null,
            uploadId: activity.upload_id ? BigInt(activity.upload_id) : null,
            externalId: activity.external_id || null,
          },
        });
      } catch (error) {
        console.error(`Failed to save activity ${activity.id}:`, error);
      }
    }
  }

  async getActivityCount(): Promise<number> {
    return this.prisma.activity.count();
  }

  async getAllActivities() {
    const activities = await this.prisma.activity.findMany({
      orderBy: {
        startDate: 'desc',
      },
    });

    // Convert BigInt to string for JSON serialization and convert distance from km to miles
    return activities.map((activity) => ({
      ...activity,
      stravaId: activity.stravaId.toString(),
      uploadId: activity.uploadId ? activity.uploadId.toString() : null,
      distance: activity.distance !== null ? activity.distance * 0.621371 : null, // Convert km to miles
    }));
  }

  async updateActivity(stravaId: string, updates: { name?: string }): Promise<void> {
    const stravaIdBigInt = BigInt(stravaId);

    try {
      await this.prisma.activity.update({
        where: { stravaId: stravaIdBigInt },
        data: {
          ...(updates.name !== undefined && { name: updates.name }),
        },
      });
    } catch (error: any) {
      // If activity doesn't exist, that's okay - we'll sync it from Strava
      if (error.code === 'P2025') {
        return;
      }
      throw error;
    }
  }
}

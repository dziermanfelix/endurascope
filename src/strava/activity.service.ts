import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StravaActivity } from './strava.service';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async saveActivities(activities: StravaActivity[]): Promise<void> {
    if (activities.length === 0) {
      return;
    }

    for (const activity of activities) {
      try {
        await this.prisma.activity.upsert({
          where: { stravaId: BigInt(activity.id) },
          create: {
            stravaId: BigInt(activity.id),
            name: activity.name || null,
            distance: activity.distance ? activity.distance / 1000 : null, // Convert to km
            movingTime: activity.moving_time || null,
            elapsedTime: activity.elapsed_time || null,
            totalElevationGain: activity.total_elevation_gain || null,
            type: activity.type || null,
            startDate: activity.start_date ? new Date(activity.start_date) : null,
            startDateLocal: activity.start_date_local
              ? new Date(activity.start_date_local)
              : null,
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
            type: activity.type || null,
            startDate: activity.start_date ? new Date(activity.start_date) : null,
            startDateLocal: activity.start_date_local
              ? new Date(activity.start_date_local)
              : null,
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
    
    // Convert BigInt to string for JSON serialization
    return activities.map((activity) => ({
      ...activity,
      stravaId: activity.stravaId.toString(),
      uploadId: activity.uploadId ? activity.uploadId.toString() : null,
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


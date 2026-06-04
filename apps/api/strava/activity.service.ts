import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StravaActivity, StravaService } from './strava.service';

export interface SaveActivitiesResult {
  created: number;
  updated: number;
}

@Injectable()
export class ActivityService {
  constructor(
    private prisma: PrismaService,
    private stravaService: StravaService
  ) {}

  async getLatestActivityStartDate(): Promise<Date | null> {
    const latest = await this.prisma.activity.findFirst({
      where: { type: 'Run' },
      orderBy: { startDate: 'desc' },
      select: { startDate: true },
    });
    return latest?.startDate ?? null;
  }

  async saveActivities(activities: StravaActivity[]): Promise<SaveActivitiesResult> {
    const result = { created: 0, updated: 0 };
    const runs = activities.filter((a) => a.type === 'Run');
    if (runs.length === 0) {
      return result;
    }

    const stravaIds = runs.map((a) => BigInt(a.id));
    const existing = await this.prisma.activity.findMany({
      where: { stravaId: { in: stravaIds } },
      select: { stravaId: true },
    });
    const existingIds = new Set(existing.map((a) => a.stravaId.toString()));

    for (const activity of runs) {
      try {
        const activityType = activity.type || null;
        const isNew = !existingIds.has(activity.id.toString());

        if (isNew) {
          try {
            const detailedActivity = await this.stravaService.getActivityById(activity.id);
            activity.average_heartrate = detailedActivity.average_heartrate ?? activity.average_heartrate;
            activity.calories = detailedActivity.calories ?? activity.calories;
            activity.average_speed = detailedActivity.average_speed ?? activity.average_speed;
          } catch {
            console.warn(
              `Failed to fetch detailed info for activity (${activity.id}|${activity.name}), using summary data only`
            );
          }
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
            averageHeartRate: activity.average_heartrate || null,
            calories: activity.calories || null,
            averageSpeed: activity.average_speed || null,
            type: activityType,
            startDate: activity.start_date ? new Date(activity.start_date) : null,
            startDateLocal: activity.start_date_local ? new Date(activity.start_date_local) : null,
          },
          update: {
            name: activity.name || null,
            distance: activity.distance ? activity.distance / 1000 : null,
            movingTime: activity.moving_time || null,
            elapsedTime: activity.elapsed_time || null,
            totalElevationGain: activity.total_elevation_gain || null,
            averageHeartRate: activity.average_heartrate || null,
            calories: activity.calories || null,
            averageSpeed: activity.average_speed || null,
            type: activityType,
            startDate: activity.start_date ? new Date(activity.start_date) : null,
            startDateLocal: activity.start_date_local ? new Date(activity.start_date_local) : null,
          },
        });

        if (isNew) {
          result.created += 1;
        } else {
          result.updated += 1;
        }
      } catch (error) {
        console.error(`Failed to save activity ${activity.id}:`, error);
      }
    }

    return result;
  }

  async getActivityCount(): Promise<number> {
    return this.prisma.activity.count();
  }

  async getAllActivities() {
    const activities = await this.prisma.activity.findMany({
      where: {
        type: 'Run',
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    // Convert BigInt to string for JSON serialization and convert distance from km to miles
    return activities.map((activity) => ({
      ...activity,
      stravaId: activity.stravaId.toString(),
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

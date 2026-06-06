import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { parseStravaStartDateLocal } from '../common/local-date';
import { PrismaService } from '../prisma/prisma.service';
import { StravaActivity, StravaService, StravaSplit } from './strava.service';

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
    const latestLocal = await this.prisma.activity.findFirst({
      where: { type: 'Run', startDateLocal: { not: null } },
      orderBy: { startDateLocal: 'desc' },
      select: { startDateLocal: true },
    });
    if (latestLocal?.startDateLocal) {
      return latestLocal.startDateLocal;
    }

    const latest = await this.prisma.activity.findFirst({
      where: { type: 'Run', startDate: { not: null } },
      orderBy: { startDate: 'desc' },
      select: { startDate: true },
    });
    return latest?.startDate ?? null;
  }

  private splitsToJson(splits: StravaSplit[] | null | undefined): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    if (!splits || splits.length === 0) {
      return Prisma.JsonNull;
    }
    return splits as unknown as Prisma.InputJsonValue;
  }

  private async applyDetailedActivity(activity: StravaActivity): Promise<void> {
    const detailedActivity = await this.stravaService.getActivityById(activity.id);
    activity.average_heartrate = detailedActivity.average_heartrate ?? activity.average_heartrate;
    activity.calories = detailedActivity.calories ?? activity.calories;
    activity.average_speed = detailedActivity.average_speed ?? activity.average_speed;
    activity.splits_standard = detailedActivity.splits_standard ?? null;
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
      select: { stravaId: true, splitsStandard: true },
    });
    const existingByStravaId = new Map(existing.map((a) => [a.stravaId.toString(), a]));

    for (const activity of runs) {
      try {
        const activityType = activity.type || null;
        const existingRecord = existingByStravaId.get(activity.id.toString());
        const isNew = !existingRecord;
        const needsDetailedFetch = isNew || existingRecord?.splitsStandard == null;

        if (needsDetailedFetch) {
          try {
            await this.applyDetailedActivity(activity);
          } catch {
            console.warn(
              `Failed to fetch detailed info for activity (${activity.id}|${activity.name}), using summary data only`
            );
          }
        }

        const splitsStandard = this.splitsToJson(activity.splits_standard);

        await this.prisma.activity.upsert({
          where: { stravaId: BigInt(activity.id) },
          create: {
            stravaId: BigInt(activity.id),
            name: activity.name || null,
            distance: activity.distance ? activity.distance / 1000 : null,
            elapsedTime: activity.elapsed_time || null,
            totalElevationGain: activity.total_elevation_gain || null,
            averageHeartRate: activity.average_heartrate || null,
            calories: activity.calories || null,
            averageSpeed: activity.average_speed || null,
            type: activityType,
            startDate: activity.start_date ? new Date(activity.start_date) : null,
            startDateLocal: activity.start_date_local ? parseStravaStartDateLocal(activity.start_date_local) : null,
            splitsStandard,
          },
          update: {
            name: activity.name || null,
            distance: activity.distance ? activity.distance / 1000 : null,
            elapsedTime: activity.elapsed_time || null,
            totalElevationGain: activity.total_elevation_gain || null,
            averageHeartRate: activity.average_heartrate || null,
            calories: activity.calories || null,
            averageSpeed: activity.average_speed || null,
            type: activityType,
            startDate: activity.start_date ? new Date(activity.start_date) : null,
            startDateLocal: activity.start_date_local ? parseStravaStartDateLocal(activity.start_date_local) : null,
            ...(needsDetailedFetch && { splitsStandard }),
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

    return activities.map((activity) => ({
      ...activity,
      stravaId: activity.stravaId.toString(),
      distance: activity.distance !== null ? activity.distance * 0.621371 : null,
      splitsStandard: activity.splitsStandard ?? null,
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
      if (error.code === 'P2025') {
        return;
      }
      throw error;
    }
  }
}

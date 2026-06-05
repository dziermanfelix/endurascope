import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PlannedWorkoutType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BulkUpdatePlannedWorkoutItemDto, UpdatePlannedWorkoutDto } from './dto/plan.dto';

const PLANNED_WORKOUT_TYPES: PlannedWorkoutType[] = ['easy', 'workout', 'long'];

const KM_TO_MILES = 0.621371;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const DAY_SLOTS: { dayCode: string; sortOrder: number }[] = [
  { dayCode: 'M', sortOrder: 0 },
  { dayCode: 'T', sortOrder: 1 },
  { dayCode: 'W', sortOrder: 2 },
  { dayCode: 'R', sortOrder: 3 },
  { dayCode: 'F', sortOrder: 4 },
  { dayCode: 'S', sortOrder: 5 },
  { dayCode: "S'", sortOrder: 6 },
];

export interface PlanActivityActual {
  id: string;
  stravaId: string;
  name: string | null;
  miles: number | null;
  movingTime: number | null;
  elapsedTime: number | null;
  averageHeartRate: number | null;
  calories: number | null;
  averageSpeed: number | null;
  totalElevationGain: number | null;
  startDateLocal: string | null;
}

export interface PlanWorkoutRow {
  id: string;
  weekNumber: number;
  dayCode: string;
  sortOrder: number;
  scheduledDate: string;
  story: string | null;
  plannedMiles: number | null;
  workoutType: PlannedWorkoutType | null;
  expectedActivityName: string | null;
  activityId: string | null;
  actual: PlanActivityActual | null;
  diffMiles: number | null;
}

export interface PlanWeekSummary {
  weekNumber: number;
  plannedRuns: number;
  plannedMiles: number;
  actualMiles: number;
  totalMovingTime: number;
  totalElapsedTime: number;
  totalCalories: number;
  heartRateSum: number;
  heartRateCount: number;
  diffMiles: number;
}

export interface TrainingBlockPlanResponse {
  block: {
    id: string;
    raceName: string;
    identifier: string;
    raceDate: string;
    startDate: string;
    durationWeeks: number;
    goalTime: string | null;
    goalDescription: string | null;
  };
  weeks: {
    weekNumber: number;
    rows: PlanWorkoutRow[];
    summary: PlanWeekSummary;
  }[];
}

@Injectable()
export class TrainingBlockPlanService {
  constructor(private prisma: PrismaService) {}

  private resolveWorkoutType(
    value: PlannedWorkoutType | string | null | undefined,
  ): PlannedWorkoutType | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (!PLANNED_WORKOUT_TYPES.includes(value as PlannedWorkoutType)) {
      throw new BadRequestException(
        `workoutType must be one of: ${PLANNED_WORKOUT_TYPES.join(', ')}`,
      );
    }
    return value as PlannedWorkoutType;
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private toLocalDateOnly(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private formatActivity(activity: {
    id: string;
    stravaId: bigint;
    name: string | null;
    distance: number | null;
    movingTime: number | null;
    elapsedTime: number | null;
    averageHeartRate: number | null;
    calories: number | null;
    averageSpeed: number | null;
    totalElevationGain: number | null;
    startDateLocal: Date | null;
  }): PlanActivityActual {
    return {
      id: activity.id,
      stravaId: activity.stravaId.toString(),
      name: activity.name,
      miles: activity.distance !== null ? activity.distance * KM_TO_MILES : null,
      movingTime: activity.movingTime,
      elapsedTime: activity.elapsedTime,
      averageHeartRate: activity.averageHeartRate,
      calories: activity.calories,
      averageSpeed: activity.averageSpeed,
      totalElevationGain: activity.totalElevationGain,
      startDateLocal: activity.startDateLocal?.toISOString() ?? null,
    };
  }

  private computeDiffMiles(plannedMiles: number | null, actualMiles: number | null): number | null {
    if (plannedMiles === null || plannedMiles === undefined) {
      return null;
    }
    const actual = actualMiles ?? 0;
    return Math.round((actual - plannedMiles) * 100) / 100;
  }

  async generatePlan(trainingBlockId: string): Promise<{ created: number; existing: number }> {
    const block = await this.prisma.trainingBlock.findUnique({ where: { id: trainingBlockId } });
    if (!block) {
      throw new NotFoundException('Training block not found');
    }

    const existingCount = await this.prisma.plannedWorkout.count({
      where: { trainingBlockId },
    });

    if (existingCount > 0) {
      return { created: 0, existing: existingCount };
    }

    const startDate = new Date(block.startDate);
    const startLocal = new Date(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
    );
    const blockStartWeek = this.getWeekStart(startLocal);

    const rows: {
      trainingBlockId: string;
      weekNumber: number;
      dayCode: string;
      scheduledDate: Date;
      sortOrder: number;
    }[] = [];

    for (let week = 0; week < block.durationWeeks; week++) {
      for (const slot of DAY_SLOTS) {
        const scheduledDate = new Date(blockStartWeek);
        scheduledDate.setDate(blockStartWeek.getDate() + week * 7 + slot.sortOrder);
        rows.push({
          trainingBlockId,
          weekNumber: week + 1,
          dayCode: slot.dayCode,
          scheduledDate,
          sortOrder: slot.sortOrder,
        });
      }
    }

    await this.prisma.plannedWorkout.createMany({ data: rows });

    return { created: rows.length, existing: 0 };
  }

  async getPlan(trainingBlockId: string): Promise<TrainingBlockPlanResponse> {
    const block = await this.prisma.trainingBlock.findUnique({ where: { id: trainingBlockId } });
    if (!block) {
      throw new NotFoundException('Training block not found');
    }

    const plannedWorkouts = await this.prisma.plannedWorkout.findMany({
      where: { trainingBlockId },
      orderBy: [{ weekNumber: 'asc' }, { sortOrder: 'asc' }],
    });

    const startDate = new Date(block.startDate);
    const endDate = new Date(startDate.getTime() + block.durationWeeks * 7 * MS_PER_DAY);

    const activities = await this.prisma.activity.findMany({
      where: {
        type: 'Run',
        startDateLocal: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: { startDateLocal: 'asc' },
    });

    const activitiesByDate = new Map<string, (typeof activities)[0][]>();
    for (const activity of activities) {
      if (!activity.startDateLocal) continue;
      const key = this.toLocalDateOnly(activity.startDateLocal).toISOString();
      const list = activitiesByDate.get(key) ?? [];
      list.push(activity);
      activitiesByDate.set(key, list);
    }

    const weekMap = new Map<number, PlanWorkoutRow[]>();

    for (const workout of plannedWorkouts) {
      const scheduledKey = this.toLocalDateOnly(workout.scheduledDate).toISOString();
      const dayActivities = activitiesByDate.get(scheduledKey) ?? [];
      const matched = dayActivities[0] ?? null;

      const actual = matched ? this.formatActivity(matched) : null;
      const diffMiles = this.computeDiffMiles(workout.plannedMiles, actual?.miles ?? null);

      const row: PlanWorkoutRow = {
        id: workout.id,
        weekNumber: workout.weekNumber,
        dayCode: workout.dayCode,
        sortOrder: workout.sortOrder,
        scheduledDate: workout.scheduledDate.toISOString(),
        story: workout.story,
        plannedMiles: workout.plannedMiles,
        workoutType: workout.workoutType,
        expectedActivityName: workout.expectedActivityName,
        activityId: matched?.id ?? workout.activityId,
        actual,
        diffMiles,
      };

      const weekRows = weekMap.get(workout.weekNumber) ?? [];
      weekRows.push(row);
      weekMap.set(workout.weekNumber, weekRows);
    }

    const weeks = Array.from(weekMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([weekNumber, rows]) => ({
        weekNumber,
        rows,
        summary: this.computeWeekSummary(weekNumber, rows),
      }));

    return {
      block: {
        id: block.id,
        raceName: block.raceName,
        identifier: block.identifier,
        raceDate: block.raceDate.toISOString(),
        startDate: block.startDate.toISOString(),
        durationWeeks: block.durationWeeks,
        goalTime: block.goalTime,
        goalDescription: block.goalDescription,
      },
      weeks,
    };
  }

  private computeWeekSummary(weekNumber: number, rows: PlanWorkoutRow[]): PlanWeekSummary {
    let plannedRuns = 0;
    let plannedMiles = 0;
    let actualMiles = 0;
    let totalMovingTime = 0;
    let totalElapsedTime = 0;
    let totalCalories = 0;
    let heartRateSum = 0;
    let heartRateCount = 0;
    let diffMiles = 0;

    for (const row of rows) {
      if (row.plannedMiles !== null && row.plannedMiles > 0) {
        plannedRuns += 1;
        plannedMiles += row.plannedMiles;
      }
      if (row.actual?.miles) {
        actualMiles += row.actual.miles;
      }
      if (row.actual?.movingTime) {
        totalMovingTime += row.actual.movingTime;
      }
      if (row.actual?.elapsedTime) {
        totalElapsedTime += row.actual.elapsedTime;
      }
      if (row.actual?.calories) {
        totalCalories += row.actual.calories;
      }
      if (row.actual?.averageHeartRate && row.actual.averageHeartRate > 0) {
        heartRateSum += row.actual.averageHeartRate;
        heartRateCount += 1;
      }
      if (row.diffMiles !== null) {
        diffMiles += row.diffMiles;
      }
    }

    return {
      weekNumber,
      plannedRuns,
      plannedMiles: Math.round(plannedMiles * 100) / 100,
      actualMiles: Math.round(actualMiles * 100) / 100,
      totalMovingTime,
      totalElapsedTime,
      totalCalories,
      heartRateSum,
      heartRateCount,
      diffMiles: Math.round(diffMiles * 100) / 100,
    };
  }

  async updatePlannedWorkout(
    trainingBlockId: string,
    workoutId: string,
    dto: UpdatePlannedWorkoutDto,
  ) {
    const workout = await this.prisma.plannedWorkout.findFirst({
      where: { id: workoutId, trainingBlockId },
    });
    if (!workout) {
      throw new NotFoundException('Planned workout not found');
    }

    const data: Record<string, unknown> = {};
    if (dto.scheduledDate !== undefined) {
      data.scheduledDate =
        dto.scheduledDate instanceof Date ? dto.scheduledDate : new Date(dto.scheduledDate);
    }
    if (dto.story !== undefined) data.story = dto.story;
    if (dto.plannedMiles !== undefined) data.plannedMiles = dto.plannedMiles;
    if (dto.workoutType !== undefined) data.workoutType = this.resolveWorkoutType(dto.workoutType);
    if (dto.expectedActivityName !== undefined) data.expectedActivityName = dto.expectedActivityName;
    if (dto.activityId !== undefined) data.activityId = dto.activityId;

    return this.prisma.plannedWorkout.update({
      where: { id: workoutId },
      data: data as Parameters<PrismaService['plannedWorkout']['update']>[0]['data'],
    });
  }

  async bulkUpdatePlan(trainingBlockId: string, workouts: BulkUpdatePlannedWorkoutItemDto[]) {
    const block = await this.prisma.trainingBlock.findUnique({ where: { id: trainingBlockId } });
    if (!block) {
      throw new NotFoundException('Training block not found');
    }

    await this.prisma.$transaction(
      workouts.map((item) => {
        const data: Record<string, unknown> = {};
        if (item.scheduledDate !== undefined) {
          data.scheduledDate =
            item.scheduledDate instanceof Date
              ? item.scheduledDate
              : new Date(item.scheduledDate);
        }
        if (item.story !== undefined) data.story = item.story;
        if (item.plannedMiles !== undefined) data.plannedMiles = item.plannedMiles;
        if (item.workoutType !== undefined) {
          data.workoutType = this.resolveWorkoutType(item.workoutType);
        }
        if (item.expectedActivityName !== undefined) {
          data.expectedActivityName = item.expectedActivityName;
        }

        return this.prisma.plannedWorkout.update({
          where: { id: item.id, trainingBlockId },
          data: data as Parameters<PrismaService['plannedWorkout']['update']>[0]['data'],
        });
      }),
    );

    return this.getPlan(trainingBlockId);
  }

}

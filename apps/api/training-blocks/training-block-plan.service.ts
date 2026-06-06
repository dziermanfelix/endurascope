import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PlannedWorkoutType } from '@prisma/client';
import {
  addUtcDays,
  getDaySortOrderUtc,
  getWeekStartUtc,
  normalizeToUtcDateOnly,
  toDateKey,
} from '../common/local-date';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePlannedWorkoutDto, UpdateTrainingWeekDto } from './dto/plan.dto';

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
  plannedMiles: number | null;
  workoutType: PlannedWorkoutType | null;
  actual: PlanActivityActual | null;
  diffMiles: number | null;
}

export interface PlanWeekSummary {
  weekNumber: number;
  plannedRuns: number;
  plannedMiles: number;
  actualMiles: number;
  totalElapsedTime: number;
  totalCalories: number;
  totalElevationGain: number;
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
    locked: boolean;
  };
  weeks: {
    id: string;
    weekNumber: number;
    story: string | null;
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
      throw new BadRequestException(`workoutType must be one of: ${PLANNED_WORKOUT_TYPES.join(', ')}`);
    }
    return value as PlannedWorkoutType;
  }

  private getBlockWindow(block: { startDate: Date; durationWeeks: number }) {
    const startLocal = normalizeToUtcDateOnly(block.startDate);
    const blockStartWeek = getWeekStartUtc(startLocal);
    const endLocal = addUtcDays(startLocal, block.durationWeeks * 7);
    return { startLocal, blockStartWeek, endLocal };
  }

  private formatActivity(
    activity: {
      id: string;
      stravaId: bigint;
      name: string | null;
      distance: number | null;
      elapsedTime: number | null;
      averageHeartRate: number | null;
      calories: number | null;
      averageSpeed: number | null;
      totalElevationGain: number | null;
      startDateLocal: Date | null;
    },
    calendarDate?: Date,
  ): PlanActivityActual {
    const localDate = calendarDate ?? (activity.startDateLocal ? normalizeToUtcDateOnly(activity.startDateLocal) : null);
    return {
      id: activity.id,
      stravaId: activity.stravaId.toString(),
      name: activity.name,
      miles: activity.distance !== null ? activity.distance * KM_TO_MILES : null,
      elapsedTime: activity.elapsedTime,
      averageHeartRate: activity.averageHeartRate,
      calories: activity.calories,
      averageSpeed: activity.averageSpeed,
      totalElevationGain: activity.totalElevationGain,
      startDateLocal: localDate?.toISOString() ?? null,
    };
  }

  private computeDiffMiles(plannedMiles: number | null, actualMiles: number | null): number | null {
    if (plannedMiles === null || plannedMiles === undefined) {
      return null;
    }
    const actual = actualMiles ?? 0;
    return Math.round((actual - plannedMiles) * 100) / 100;
  }

  private getActivityWeekNumber(blockStartWeek: Date, activityLocal: Date, durationWeeks: number): number | null {
    const diffDays = Math.floor(
      (normalizeToUtcDateOnly(activityLocal).getTime() - blockStartWeek.getTime()) / MS_PER_DAY,
    );
    if (diffDays < 0) return null;
    const weekNumber = Math.floor(diffDays / 7) + 1;
    if (weekNumber > durationWeeks) return null;
    return weekNumber;
  }

  private buildActivityRow(
    activity: {
      id: string;
      stravaId: bigint;
      name: string | null;
      distance: number | null;
      elapsedTime: number | null;
      averageHeartRate: number | null;
      calories: number | null;
      averageSpeed: number | null;
      totalElevationGain: number | null;
      startDateLocal: Date | null;
    },
    weekNumber: number,
    calendarDate: Date,
  ): PlanWorkoutRow {
    const sortOrder = getDaySortOrderUtc(calendarDate);
    return {
      id: `activity:${activity.id}`,
      weekNumber,
      dayCode: DAY_SLOTS[sortOrder].dayCode,
      sortOrder,
      scheduledDate: calendarDate.toISOString(),
      plannedMiles: null,
      workoutType: null,
      actual: this.formatActivity(activity, calendarDate),
      diffMiles: null,
    };
  }

  private sortWeekRows(rows: PlanWorkoutRow[]): PlanWorkoutRow[] {
    return [...rows].sort((a, b) => a.sortOrder - b.sortOrder || a.scheduledDate.localeCompare(b.scheduledDate));
  }

  private normalizeActivityCalendarDate(activity: { startDateLocal: Date | null }): Date | null {
    if (!activity.startDateLocal) return null;
    return normalizeToUtcDateOnly(activity.startDateLocal);
  }

  private scheduledDateForResponse(date: Date): string {
    return normalizeToUtcDateOnly(date).toISOString();
  }

  private async ensureTrainingWeeks(trainingBlockId: string, durationWeeks: number): Promise<void> {
    const existing = await this.prisma.trainingWeek.findMany({
      where: { trainingBlockId },
      select: { weekNumber: true },
    });
    const existingWeeks = new Set(existing.map((w) => w.weekNumber));
    const toCreate: { trainingBlockId: string; weekNumber: number }[] = [];

    for (let weekNumber = 1; weekNumber <= durationWeeks; weekNumber++) {
      if (!existingWeeks.has(weekNumber)) {
        toCreate.push({ trainingBlockId, weekNumber });
      }
    }

    if (toCreate.length > 0) {
      await this.prisma.trainingWeek.createMany({ data: toCreate });
    }
  }

  private async assertBlockEditable(trainingBlockId: string): Promise<void> {
    const block = await this.prisma.trainingBlock.findUnique({
      where: { id: trainingBlockId },
      select: { locked: true },
    });
    if (!block) {
      throw new NotFoundException('Training block not found');
    }
    if (block.locked) {
      throw new BadRequestException('Training block is locked');
    }
  }

  private async ensurePlanSkeleton(
    trainingBlockId: string,
    block: { startDate: Date; durationWeeks: number },
  ): Promise<void> {
    const existingCount = await this.prisma.plannedWorkout.count({
      where: { trainingBlockId },
    });
    if (existingCount > 0) return;

    const { blockStartWeek } = this.getBlockWindow(block);

    const rows: {
      trainingBlockId: string;
      weekNumber: number;
      dayCode: string;
      scheduledDate: Date;
      sortOrder: number;
    }[] = [];

    for (let week = 0; week < block.durationWeeks; week++) {
      for (const slot of DAY_SLOTS) {
        const scheduledDate = addUtcDays(blockStartWeek, week * 7 + slot.sortOrder);
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
  }

  async generatePlan(trainingBlockId: string): Promise<{ created: number; existing: number }> {
    const block = await this.prisma.trainingBlock.findUnique({ where: { id: trainingBlockId } });
    if (!block) {
      throw new NotFoundException('Training block not found');
    }
    if (block.locked) {
      throw new BadRequestException('Training block is locked');
    }

    const existingCount = await this.prisma.plannedWorkout.count({
      where: { trainingBlockId },
    });

    if (existingCount > 0) {
      return { created: 0, existing: existingCount };
    }

    await this.ensurePlanSkeleton(trainingBlockId, block);
    await this.ensureTrainingWeeks(trainingBlockId, block.durationWeeks);

    const created = block.durationWeeks * DAY_SLOTS.length;
    return { created, existing: 0 };
  }

  async getPlan(trainingBlockId: string): Promise<TrainingBlockPlanResponse> {
    const block = await this.prisma.trainingBlock.findUnique({ where: { id: trainingBlockId } });
    if (!block) {
      throw new NotFoundException('Training block not found');
    }

    await this.ensureTrainingWeeks(trainingBlockId, block.durationWeeks);
    await this.ensurePlanSkeleton(trainingBlockId, block);

    const trainingWeeks = await this.prisma.trainingWeek.findMany({
      where: { trainingBlockId },
      orderBy: { weekNumber: 'asc' },
    });
    const storyByWeek = new Map(trainingWeeks.map((w) => [w.weekNumber, w]));

    const plannedWorkouts = await this.prisma.plannedWorkout.findMany({
      where: { trainingBlockId },
      orderBy: [{ weekNumber: 'asc' }, { sortOrder: 'asc' }],
    });

    const { startLocal, blockStartWeek, endLocal } = this.getBlockWindow(block);

    const activities = await this.prisma.activity.findMany({
      where: {
        type: 'Run',
        startDateLocal: {
          gte: startLocal,
          lt: endLocal,
        },
      },
      orderBy: { startDateLocal: 'asc' },
    });

    const activitiesByDate = new Map<string, (typeof activities)[0][]>();
    for (const activity of activities) {
      const calendarDate = this.normalizeActivityCalendarDate(activity);
      if (!calendarDate) continue;
      const key = toDateKey(calendarDate);
      const list = activitiesByDate.get(key) ?? [];
      list.push(activity);
      activitiesByDate.set(key, list);
    }

    const weekMap = new Map<number, PlanWorkoutRow[]>();
    const matchedActivityIds = new Set<string>();

    for (const workout of plannedWorkouts) {
      const scheduledKey = toDateKey(normalizeToUtcDateOnly(workout.scheduledDate));
      const dayActivities = activitiesByDate.get(scheduledKey) ?? [];
      const matched = dayActivities[0] ?? null;

      if (matched) {
        matchedActivityIds.add(matched.id);
      }

      const calendarDate = normalizeToUtcDateOnly(workout.scheduledDate);
      const actual = matched
        ? this.formatActivity(matched, this.normalizeActivityCalendarDate(matched) ?? calendarDate)
        : null;
      const diffMiles = this.computeDiffMiles(workout.plannedMiles, actual?.miles ?? null);

      const row: PlanWorkoutRow = {
        id: workout.id,
        weekNumber: workout.weekNumber,
        dayCode: workout.dayCode,
        sortOrder: workout.sortOrder,
        scheduledDate: this.scheduledDateForResponse(workout.scheduledDate),
        plannedMiles: workout.plannedMiles,
        workoutType: workout.workoutType,
        actual,
        diffMiles,
      };

      const weekRows = weekMap.get(workout.weekNumber) ?? [];
      weekRows.push(row);
      weekMap.set(workout.weekNumber, weekRows);
    }

    for (const activity of activities) {
      if (!activity.startDateLocal || matchedActivityIds.has(activity.id)) continue;

      const calendarDate = this.normalizeActivityCalendarDate(activity);
      if (!calendarDate) continue;

      const weekNumber = this.getActivityWeekNumber(blockStartWeek, calendarDate, block.durationWeeks);
      if (weekNumber === null) continue;

      const row = this.buildActivityRow(activity, weekNumber, calendarDate);
      const weekRows = weekMap.get(weekNumber) ?? [];
      weekRows.push(row);
      weekMap.set(weekNumber, weekRows);
    }

    for (const [weekNumber, rows] of weekMap.entries()) {
      weekMap.set(weekNumber, this.sortWeekRows(rows));
    }

    const weeks = Array.from(weekMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([weekNumber, rows]) => {
        const trainingWeek = storyByWeek.get(weekNumber);
        return {
          id: trainingWeek?.id ?? '',
          weekNumber,
          story: trainingWeek?.story ?? null,
          rows,
          summary: this.computeWeekSummary(weekNumber, rows),
        };
      });

    for (const trainingWeek of trainingWeeks) {
      if (!weekMap.has(trainingWeek.weekNumber)) {
        weeks.push({
          id: trainingWeek.id,
          weekNumber: trainingWeek.weekNumber,
          story: trainingWeek.story,
          rows: [],
          summary: this.computeWeekSummary(trainingWeek.weekNumber, []),
        });
      }
    }
    weeks.sort((a, b) => a.weekNumber - b.weekNumber);

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
        locked: block.locked,
      },
      weeks,
    };
  }

  private computeWeekSummary(weekNumber: number, rows: PlanWorkoutRow[]): PlanWeekSummary {
    let plannedRuns = 0;
    let plannedMiles = 0;
    let actualMiles = 0;
    let totalElapsedTime = 0;
    let totalCalories = 0;
    let totalElevationGain = 0;
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
      if (row.actual?.elapsedTime) {
        totalElapsedTime += row.actual.elapsedTime;
      }
      if (row.actual?.calories) {
        totalCalories += row.actual.calories;
      }
      if (row.actual?.totalElevationGain) {
        totalElevationGain += row.actual.totalElevationGain;
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
      totalElapsedTime,
      totalCalories,
      totalElevationGain,
      heartRateSum,
      heartRateCount,
      diffMiles: Math.round(diffMiles * 100) / 100,
    };
  }

  async updatePlannedWorkout(trainingBlockId: string, workoutId: string, dto: UpdatePlannedWorkoutDto) {
    await this.assertBlockEditable(trainingBlockId);

    const workout = await this.prisma.plannedWorkout.findFirst({
      where: { id: workoutId, trainingBlockId },
    });
    if (!workout) {
      throw new NotFoundException('Planned workout not found');
    }

    const data: Record<string, unknown> = {};
    if (dto.scheduledDate !== undefined) {
      const parsed = dto.scheduledDate instanceof Date ? dto.scheduledDate : new Date(dto.scheduledDate);
      data.scheduledDate = normalizeToUtcDateOnly(parsed);
    }
    if (dto.plannedMiles !== undefined) data.plannedMiles = dto.plannedMiles;
    if (dto.workoutType !== undefined) data.workoutType = this.resolveWorkoutType(dto.workoutType);
    return this.prisma.plannedWorkout.update({
      where: { id: workoutId },
      data: data as Parameters<PrismaService['plannedWorkout']['update']>[0]['data'],
    });
  }

  async updateTrainingWeek(trainingBlockId: string, weekNumber: number, dto: UpdateTrainingWeekDto) {
    await this.assertBlockEditable(trainingBlockId);

    await this.ensureTrainingWeeks(
      trainingBlockId,
      (
        await this.prisma.trainingBlock.findUnique({
          where: { id: trainingBlockId },
          select: { durationWeeks: true },
        })
      )?.durationWeeks ?? weekNumber,
    );

    const trainingWeek = await this.prisma.trainingWeek.findUnique({
      where: {
        trainingBlockId_weekNumber: { trainingBlockId, weekNumber },
      },
    });

    if (!trainingWeek) {
      throw new NotFoundException('Training week not found');
    }

    return this.prisma.trainingWeek.update({
      where: { id: trainingWeek.id },
      data: {
        ...(dto.story !== undefined && { story: dto.story }),
      },
    });
  }
}

import { PlannedWorkoutType } from '@prisma/client';

export class UpdatePlannedWorkoutDto {
  scheduledDate?: Date | string;
  story?: string | null;
  plannedMiles?: number | null;
  workoutType?: PlannedWorkoutType | null;
  expectedActivityName?: string | null;
  activityId?: string | null;
}

export class BulkUpdatePlannedWorkoutItemDto {
  id: string;
  scheduledDate?: Date | string;
  story?: string | null;
  plannedMiles?: number | null;
  workoutType?: PlannedWorkoutType | null;
  expectedActivityName?: string | null;
}

export class BulkUpdatePlanDto {
  workouts: BulkUpdatePlannedWorkoutItemDto[];
}

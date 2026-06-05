import { PlannedWorkoutType } from '@prisma/client';

export class UpdatePlannedWorkoutDto {
  scheduledDate?: Date | string;
  plannedMiles?: number | null;
  workoutType?: PlannedWorkoutType | null;
  expectedActivityName?: string | null;
  activityId?: string | null;
}

export class UpdateTrainingWeekDto {
  story?: string | null;
}

export class BulkUpdatePlannedWorkoutItemDto {
  id: string;
  scheduledDate?: Date | string;
  plannedMiles?: number | null;
  workoutType?: PlannedWorkoutType | null;
  expectedActivityName?: string | null;
}

export class BulkUpdatePlanDto {
  workouts: BulkUpdatePlannedWorkoutItemDto[];
}

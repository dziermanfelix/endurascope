import { PlannedWorkoutType } from '@prisma/client';

export class UpdatePlannedWorkoutDto {
  scheduledDate?: Date | string;
  plannedMiles?: number | null;
  workoutType?: PlannedWorkoutType | null;
}

export class UpdateTrainingWeekDto {
  story?: string | null;
}

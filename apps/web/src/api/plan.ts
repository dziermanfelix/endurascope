import type { PlannedWorkoutType } from '../util/planWorkoutType';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

export interface TrainingBlockPlan {
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

export interface UpdateTrainingWeekDto {
  story?: string | null;
}

export interface UpdatePlannedWorkoutDto {
  scheduledDate?: string;
  plannedMiles?: number | null;
  workoutType?: PlannedWorkoutType | null;
}

export async function fetchTrainingBlockPlan(blockId: string): Promise<TrainingBlockPlan> {
  const response = await fetch(`${API_BASE_URL}/api/training-blocks/${blockId}/plan`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch training plan');
  }
  return response.json();
}

export async function generateTrainingBlockPlan(blockId: string): Promise<{ created: number; existing: number }> {
  const response = await fetch(`${API_BASE_URL}/api/training-blocks/${blockId}/plan/generate`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to generate training plan');
  }
  return response.json();
}

export async function updateTrainingWeek(
  blockId: string,
  weekNumber: number,
  data: UpdateTrainingWeekDto,
): Promise<TrainingBlockPlan> {
  const response = await fetch(`${API_BASE_URL}/api/training-blocks/${blockId}/plan/weeks/${weekNumber}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update training week');
  }
  return response.json();
}

export async function updatePlannedWorkout(
  blockId: string,
  workoutId: string,
  data: UpdatePlannedWorkoutDto,
): Promise<TrainingBlockPlan> {
  const response = await fetch(`${API_BASE_URL}/api/training-blocks/${blockId}/plan/${workoutId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update planned workout');
  }
  return response.json();
}

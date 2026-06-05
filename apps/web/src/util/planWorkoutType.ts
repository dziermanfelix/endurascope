export const PLANNED_WORKOUT_TYPES = ['easy', 'workout', 'long'] as const;

export type PlannedWorkoutType = (typeof PLANNED_WORKOUT_TYPES)[number];

export function isPlannedWorkoutType(value: string): value is PlannedWorkoutType {
  return (PLANNED_WORKOUT_TYPES as readonly string[]).includes(value);
}

export function formatWorkoutTypeLabel(type: PlannedWorkoutType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

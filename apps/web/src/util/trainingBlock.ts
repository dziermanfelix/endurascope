import type { Activity } from '../types/activity';
import type { TrainingBlock } from '../api/training-blocks';

function normalizeUtcDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0, 0));
}

function getBlockWindow(block: TrainingBlock): { start: Date; end: Date } {
  const start = normalizeUtcDateOnly(new Date(block.startDate));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + block.durationWeeks * 7);
  return { start, end };
}

function isActivityInBlock(activity: Activity, block: TrainingBlock): boolean {
  if (!activity.startDateLocal) return false;

  const activityMidnight = normalizeUtcDateOnly(new Date(activity.startDateLocal));
  const { start, end } = getBlockWindow(block);

  return activityMidnight >= start && activityMidnight < end;
}

export function filterActivitiesByBlock(activities: Activity[], block: TrainingBlock | null): Activity[] {
  if (!block) return activities;
  return activities.filter((a) => isActivityInBlock(a, block));
}

export function byStartDateDesc(a: { startDate: Date | string }, b: { startDate: Date | string }): number {
  return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
}

import type { Activity } from '../types/activity';
import type { TrainingBlock } from '../api/training-blocks';
import { parseActivityDate } from './time';

function getBlockWindow(block: TrainingBlock): { start: Date; end: Date } {
  const start = new Date(block.startDate);
  const startLocal = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  startLocal.setHours(0, 0, 0, 0);

  const end = new Date(startLocal);
  end.setDate(end.getDate() + block.durationWeeks * 7);

  return { start: startLocal, end };
}

function isActivityInBlock(activity: Activity, block: TrainingBlock): boolean {
  const activityDate = parseActivityDate(activity);
  if (!activityDate) return false;

  const activityMidnight = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());
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

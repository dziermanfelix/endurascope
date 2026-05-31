import type { Activity } from '../types/activity';
import type { TrainingBlock } from '../api/training-blocks';
import { parseActivityDate } from './time';

/**
 * Block window in local date: [blockStart, blockEnd) where
 * blockStart = startDate at local midnight, blockEnd = blockStart + durationWeeks * 7 days.
 */
function getBlockWindow(block: TrainingBlock): { start: Date; end: Date } {
  const start = new Date(block.startDate);
  const startLocal = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  startLocal.setHours(0, 0, 0, 0);

  const end = new Date(startLocal);
  end.setDate(end.getDate() + block.durationWeeks * 7);

  return { start: startLocal, end };
}

/**
 * Returns true if the activity's startDateLocal falls within the block's date range [start, end).
 */
export function isActivityInBlock(activity: Activity, block: TrainingBlock): boolean {
  const activityDate = parseActivityDate(activity);
  if (!activityDate) return false;

  const activityMidnight = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());
  const { start, end } = getBlockWindow(block);

  return activityMidnight >= start && activityMidnight < end;
}

/**
 * Returns all activities if block is null; otherwise returns activities whose date is in the block window.
 */
export function filterActivitiesByBlock(activities: Activity[], block: TrainingBlock | null): Activity[] {
  if (!block) return activities;
  return activities.filter((a) => isActivityInBlock(a, block));
}

/**
 * Sort by startDate descending
 * @param a Sortable object with a startDate property
 * @param b Sortable object with a startDate property
 * @returns Difference in milliseconds between the startDates of a and b
 */
export function byStartDateDesc(a: { startDate: Date | string }, b: { startDate: Date | string }): number {
  return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
}

export function hasRacePassed(raceDate: Date | string): boolean {
  const race = new Date(raceDate);
  const today = new Date();
  race.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return race < today;
}

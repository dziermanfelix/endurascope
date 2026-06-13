import type { Activity } from '../types/activity';
import type { TrainingBlock } from '../api/training-blocks';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function normalizeUtcDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0, 0));
}

/** Monday-start week containing the given UTC calendar date. */
function getWeekStartUtc(date: Date): Date {
  const normalized = normalizeUtcDateOnly(date);
  const day = normalized.getUTCDay();
  const diff = normalized.getUTCDate() - day + (day === 0 ? -6 : 1);
  return new Date(Date.UTC(normalized.getUTCFullYear(), normalized.getUTCMonth(), diff, 12, 0, 0, 0));
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

export function isActiveTrainingBlock(block: TrainingBlock, today: Date = new Date()): boolean {
  const todayLocal = normalizeUtcDateOnly(today);
  const { start, end } = getBlockWindow(block);
  return todayLocal >= start && todayLocal < end;
}

/** Week number for today within a block, matching server plan logic. */
export function getCurrentWeekNumber(block: TrainingBlock, today: Date = new Date()): number | null {
  const startLocal = normalizeUtcDateOnly(new Date(block.startDate));
  const blockStartWeek = getWeekStartUtc(startLocal);
  const todayLocal = normalizeUtcDateOnly(today);

  const diffDays = Math.floor((todayLocal.getTime() - blockStartWeek.getTime()) / MS_PER_DAY);
  if (diffDays < 0) return null;

  const weekNumber = Math.floor(diffDays / 7) + 1;
  if (weekNumber > block.durationWeeks) return block.durationWeeks;
  return weekNumber;
}

/** Week to scroll to when opening the in-progress training plan. */
export function getScrollToWeekNumber(block: TrainingBlock, today: Date = new Date()): number | null {
  if (!isActiveTrainingBlock(block, today)) return null;
  return getCurrentWeekNumber(block, today) ?? 1;
}

import type { Activity } from '../types/activity';
import { parseActivityDate } from './time';

export const MORNING_RUN_NAME = 'Morning Run';

export function isMorningRun(activity: Activity): boolean {
  return activity.name?.trim().toLowerCase() === MORNING_RUN_NAME.toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function isNumberedBlockRun(activity: Activity, identifier: string): boolean {
  const name = activity.name?.trim();
  if (!name) return false;
  if (isMorningRun(activity)) return true;
  return new RegExp(`^${escapeRegExp(identifier)}\\d+$`, 'i').test(name);
}

function sortActivitiesByDate(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => {
    const dateA = parseActivityDate(a)?.getTime() ?? 0;
    const dateB = parseActivityDate(b)?.getTime() ?? 0;
    return dateA - dateB;
  });
}

export function getBlockRunActivities(activities: Activity[], identifier: string): Activity[] {
  return sortActivitiesByDate(activities.filter((activity) => isNumberedBlockRun(activity, identifier)));
}

export function planMorningRunRenames(
  blockActivities: Activity[],
  identifier: string,
): { activity: Activity; newName: string }[] {
  const runs = getBlockRunActivities(blockActivities, identifier);
  if (runs.length === 0) return [];

  const padLength = Math.max(2, String(runs.length).length);

  return runs
    .map((activity, i) => ({
      activity,
      newName: `${identifier}${String(i + 1).padStart(padLength, '0')}`,
    }))
    .filter(({ activity, newName }) => activity.name?.trim().toLowerCase() !== newName.toLowerCase());
}

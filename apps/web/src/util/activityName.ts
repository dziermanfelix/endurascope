import type { Activity } from '../types/activity';
import { parseActivityDate } from './time';

const MORNING_RUN_NAME = 'Morning Run';

function isMorningRun(activity: Activity): boolean {
  return activity.name?.trim().toLowerCase() === MORNING_RUN_NAME.toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseNumberedBlockRunName(name: string, identifier: string): { number: number; suffix: string } | null {
  const match = name.trim().match(new RegExp(`^${escapeRegExp(identifier)}(\\d+)(.*)$`, 'i'));
  if (!match) return null;

  return {
    number: parseInt(match[1], 10),
    suffix: match[2],
  };
}

function getNameSuffix(activity: Activity, identifier: string): string {
  const name = activity.name?.trim();
  if (!name || isMorningRun(activity)) return '';

  return parseNumberedBlockRunName(name, identifier)?.suffix ?? '';
}

function isNumberedBlockRun(activity: Activity, identifier: string): boolean {
  const name = activity.name?.trim();
  if (!name) return false;
  if (isMorningRun(activity)) return true;
  return parseNumberedBlockRunName(name, identifier) !== null;
}

function sortActivitiesByDate(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => {
    const dateA = parseActivityDate(a)?.getTime() ?? 0;
    const dateB = parseActivityDate(b)?.getTime() ?? 0;
    return dateA - dateB;
  });
}

function getBlockRunActivities(activities: Activity[], identifier: string): Activity[] {
  return sortActivitiesByDate(activities.filter((activity) => isNumberedBlockRun(activity, identifier)));
}

export function planMorningRunRenames(
  blockActivities: Activity[],
  identifier: string,
): { activity: Activity; newName: string }[] {
  const runs = getBlockRunActivities(blockActivities, identifier);
  if (runs.length === 0) return [];

  const padLength = Math.max(3, String(runs.length).length);

  return runs
    .map((activity, i) => {
      const suffix = getNameSuffix(activity, identifier);
      const newPrefix = `${identifier}${String(i + 1).padStart(padLength, '0')}`;
      return {
        activity,
        newName: `${newPrefix}${suffix}`,
      };
    })
    .filter(({ activity, newName }) => activity.name?.trim().toLowerCase() !== newName.toLowerCase());
}

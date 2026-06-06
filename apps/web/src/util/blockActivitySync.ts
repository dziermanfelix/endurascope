import {
  fetchActivities,
  refetchActivitiesFromStrava,
  updateActivityName,
  type RefetchActivitiesResult,
} from '../api/activities';
import type { TrainingBlock } from '../api/training-blocks';
import { planMorningRunRenames } from './activityName';
import { filterActivitiesByBlock } from './trainingBlock';

export type SyncBlockActivitiesResult = RefetchActivitiesResult & { renamed: number };

const emptySyncResult = (total: number): SyncBlockActivitiesResult => ({
  success: true,
  mode: 'incremental',
  skipped: true,
  fetched: 0,
  created: 0,
  updated: 0,
  total,
  renamed: 0,
});

export async function syncAndRenameForBlock(
  block: TrainingBlock,
  options?: { full?: boolean },
): Promise<SyncBlockActivitiesResult> {
  let result: RefetchActivitiesResult = emptySyncResult(0);

  if (!options?.full) {
    try {
      result = await refetchActivitiesFromStrava();
    } catch (err) {
      console.warn('Incremental Strava sync failed, continuing with local activities:', err);
    }
  } else {
    result = await refetchActivitiesFromStrava({ full: true });
  }

  const activities = await fetchActivities();
  const blockActivities = filterActivitiesByBlock(activities, block);
  const renamePlan = planMorningRunRenames(blockActivities, block.identifier);

  let renamed = 0;
  for (const { activity, newName } of renamePlan) {
    try {
      await updateActivityName(activity.stravaId.toString(), newName);
      renamed += 1;
    } catch (err) {
      console.warn(`Failed to rename activity ${activity.stravaId}:`, err);
    }
  }

  return { ...result, total: activities.length, renamed };
}

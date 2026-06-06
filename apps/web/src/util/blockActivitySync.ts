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

export async function syncAndRenameForBlock(
  block: TrainingBlock,
  options?: { full?: boolean },
): Promise<SyncBlockActivitiesResult> {
  const result = await refetchActivitiesFromStrava(options);
  const activities = await fetchActivities();
  const blockActivities = filterActivitiesByBlock(activities, block);
  const renamePlan = planMorningRunRenames(blockActivities, block.identifier);

  for (const { activity, newName } of renamePlan) {
    await updateActivityName(activity.stravaId.toString(), newName);
  }

  return { ...result, renamed: renamePlan.length };
}

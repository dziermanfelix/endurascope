import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TrainingBlock } from '../api/training-blocks';
import { fetchTrainingBlockPlan, type TrainingBlockPlan } from '../api/plan';
import { ActivityModal } from '../components/ActivityModal';
import { BlockPlanGrid } from '../components/BlockPlanGrid';
import { TrainingBlockSelector } from '../components/TrainingBlockSelector';
import { WorkoutLegend } from '../components/WorkoutLegend';
import { useActivities } from '../contexts/ActivitiesContext';
import { useSelectedTrainingBlock } from '../contexts/SelectedTrainingBlockContext';
import type { Activity } from '../types/activity';
import { syncAndRenameForBlock } from '../util/blockActivitySync';
import { normalizePlanWeeks } from '../util/planWeeks';

export function BlockPlan() {
  const { selectedTrainingBlock } = useSelectedTrainingBlock();
  const { activities, loadActivities } = useActivities();
  const [plan, setPlan] = useState<TrainingBlockPlan | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncAndLoadPlan = useCallback(
    async (block: TrainingBlock) => {
      setIsLoading(true);
      setError(null);
      try {
        await syncAndRenameForBlock(block);
        await loadActivities();
      } catch (err) {
        console.warn('Activity sync failed, loading plan from local data:', err);
        await loadActivities();
      }

      try {
        const data = await fetchTrainingBlockPlan(block.id);
        setPlan(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load plan');
        setPlan(null);
      } finally {
        setIsLoading(false);
      }
    },
    [loadActivities],
  );

  useEffect(() => {
    if (!selectedTrainingBlock) {
      setPlan(null);
      return;
    }
    syncAndLoadPlan(selectedTrainingBlock);
  }, [selectedTrainingBlock, syncAndLoadPlan]);

  const displayPlan = useMemo(() => (plan ? normalizePlanWeeks(plan) : null), [plan]);

  const handleActivityClick = (activityId: string) => {
    const activity = activities.find((a) => a.id === activityId);
    if (activity) setSelectedActivity(activity);
  };

  const refreshPlan = async () => {
    if (!selectedTrainingBlock) return;
    const data = await fetchTrainingBlockPlan(selectedTrainingBlock.id);
    setPlan(data);
  };

  const blockSummary = plan?.block ?? selectedTrainingBlock;

  return (
    <div>
      <div className='flex flex-wrap items-center justify-between gap-4 mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Training Plan</h1>
          <p className='text-sm text-gray-500 mt-1'>
            Plan your block week-by-week; results fill in automatically from Strava.
          </p>
        </div>
        <TrainingBlockSelector />
      </div>

      {!selectedTrainingBlock && (
        <div className='bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg'>
          Select a training block above to view and edit your plan grid.
        </div>
      )}

      {selectedTrainingBlock && (
        <>
          <div className='mb-4 flex flex-wrap items-center gap-3'>
            <button
              type='button'
              onClick={() => syncAndLoadPlan(selectedTrainingBlock)}
              disabled={isLoading}
              className='text-sm px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50'
            >
              Refresh
            </button>
          </div>

          {blockSummary && (
            <div className='mb-6 p-4 bg-white border border-gray-200 rounded-lg'>
              <h2 className='text-xl font-semibold text-gray-900'>{blockSummary.raceName}</h2>
              <p className='text-sm text-gray-600 mt-1'>
                {blockSummary.durationWeeks} weeks · identifier{' '}
                <span className='font-mono'>{blockSummary.identifier}</span>
              </p>
              {(blockSummary.goalDescription || blockSummary.goalTime) && (
                <p className='text-sm text-gray-700 mt-2'>
                  Goal: {blockSummary.goalDescription}
                  {blockSummary.goalTime ? ` (${blockSummary.goalTime})` : ''}
                </p>
              )}
            </div>
          )}

          <WorkoutLegend />

          {error && <div className='mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>{error}</div>}

          {isLoading && <p className='text-gray-500'>Syncing runs and loading plan…</p>}

          {!isLoading && displayPlan && (
            <BlockPlanGrid
              plan={displayPlan}
              onPlanUpdated={(updated) => setPlan(normalizePlanWeeks(updated))}
              onActivityClick={handleActivityClick}
            />
          )}
        </>
      )}

      {selectedActivity && (
        <ActivityModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onUpdated={refreshPlan}
        />
      )}
    </div>
  );
}

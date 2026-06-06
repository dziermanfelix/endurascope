import { useCallback, useEffect, useState } from 'react';
import type { TrainingBlock } from '../api/training-blocks';
import { fetchTrainingBlockPlan, generateTrainingBlockPlan, type TrainingBlockPlan } from '../api/plan';
import { ActivityModal } from '../components/ActivityModal';
import { BlockPlanGrid } from '../components/BlockPlanGrid';
import { TrainingBlockSelector } from '../components/TrainingBlockSelector';
import { WorkoutLegend } from '../components/WorkoutLegend';
import { useActivities } from '../contexts/ActivitiesContext';
import { useSelectedTrainingBlock } from '../contexts/SelectedTrainingBlockContext';
import type { Activity } from '../types/activity';
import { syncAndRenameForBlock } from '../util/blockActivitySync';

export function BlockPlan() {
  const { selectedTrainingBlock } = useSelectedTrainingBlock();
  const { activities, loadActivities } = useActivities();
  const [plan, setPlan] = useState<TrainingBlockPlan | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncAndLoadPlan = useCallback(
    async (block: TrainingBlock) => {
      setIsLoading(true);
      setError(null);
      try {
        await syncAndRenameForBlock(block);
        await loadActivities();
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

  const handleGenerate = async () => {
    if (!selectedTrainingBlock) return;
    setIsGenerating(true);
    setError(null);
    try {
      await generateTrainingBlockPlan(selectedTrainingBlock.id);
      await syncAndLoadPlan(selectedTrainingBlock);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const hasWeeks = plan && plan.weeks.length > 0;

  const handleActivityClick = (activityId: string) => {
    const activity = activities.find((a) => a.id === activityId);
    if (activity) setSelectedActivity(activity);
  };

  const refreshPlan = async () => {
    if (!selectedTrainingBlock) return;
    const data = await fetchTrainingBlockPlan(selectedTrainingBlock.id);
    setPlan(data);
  };

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
            {!hasWeeks && (
              <button
                type='button'
                onClick={handleGenerate}
                disabled={isGenerating}
                className='text-sm px-3 py-1.5 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50'
              >
                {isGenerating ? 'Generating…' : 'Generate plan grid'}
              </button>
            )}
          </div>

          {plan?.block && (
            <div className='mb-6 p-4 bg-white border border-gray-200 rounded-lg'>
              <h2 className='text-xl font-semibold text-gray-900'>{plan.block.raceName}</h2>
              <p className='text-sm text-gray-600 mt-1'>
                {plan.block.durationWeeks} weeks · identifier <span className='font-mono'>{plan.block.identifier}</span>
              </p>
              {(plan.block.goalDescription || plan.block.goalTime) && (
                <p className='text-sm text-gray-700 mt-2'>
                  Goal: {plan.block.goalDescription}
                  {plan.block.goalTime ? ` (${plan.block.goalTime})` : ''}
                </p>
              )}
            </div>
          )}

          <WorkoutLegend />

          {error && <div className='mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>{error}</div>}

          {isLoading && <p className='text-gray-500'>Syncing runs and loading plan…</p>}

          {!isLoading && plan && hasWeeks && (
            <BlockPlanGrid plan={plan} onPlanUpdated={setPlan} onActivityClick={handleActivityClick} />
          )}

          {!isLoading && plan && !hasWeeks && (
            <p className='text-gray-500'>
              No plan rows yet. Click &quot;Generate plan grid&quot; to create the skeleton.
            </p>
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

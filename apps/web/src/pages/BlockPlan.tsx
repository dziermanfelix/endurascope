import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TrainingBlock } from '../api/training-blocks';
import { fetchTrainingBlockPlan, updateTrainingWeek, type TrainingBlockPlan } from '../api/plan';
import { ActivityModal } from '../components/ActivityModal';
import { BlockPlanGrid } from '../components/BlockPlanGrid';
import { TrainingBlockNavigator } from '../components/TrainingBlockNavigator';
import LockIcon from '../icons/LockIcon';
import LoadingIcon from '../icons/LoadingIcon';
import { useActivities } from '../contexts/ActivitiesContext';
import { useSelectedTrainingBlock } from '../contexts/SelectedTrainingBlockContext';
import type { Activity } from '../types/activity';
import { syncAndRenameForBlock } from '../util/blockActivitySync';
import { blurOnEnter } from '../util/form';
import { normalizePlanWeeks } from '../util/planWeeks';
import { getScrollToWeekNumber } from '../util/trainingBlock';

export function BlockPlan() {
  const { selectedTrainingBlock } = useSelectedTrainingBlock();
  const { activities, loadActivities } = useActivities();
  const [plan, setPlan] = useState<TrainingBlockPlan | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentWeekRef = useRef<HTMLElement | null>(null);
  const scrolledToWeekForBlockRef = useRef<string | null>(null);

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
    scrolledToWeekForBlockRef.current = null;
    syncAndLoadPlan(selectedTrainingBlock);
  }, [selectedTrainingBlock, syncAndLoadPlan]);

  const displayPlan = useMemo(() => (plan ? normalizePlanWeeks(plan) : null), [plan]);
  const scrollToWeekNumber = useMemo(() => {
    if (!displayPlan || !selectedTrainingBlock || displayPlan.block.id !== selectedTrainingBlock.id) {
      return null;
    }
    return getScrollToWeekNumber(selectedTrainingBlock);
  }, [displayPlan, selectedTrainingBlock]);

  useEffect(() => {
    if (!displayPlan || scrollToWeekNumber === null) return;
    if (scrolledToWeekForBlockRef.current === displayPlan.block.id) return;

    scrolledToWeekForBlockRef.current = displayPlan.block.id;
    requestAnimationFrame(() => {
      currentWeekRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [displayPlan, scrollToWeekNumber]);

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
          <h1 className='flex items-center gap-2 text-2xl font-bold text-gray-900'>
            {selectedTrainingBlock?.raceName ?? 'Training Plan'}
            {selectedTrainingBlock?.locked && (
              <span className='text-gray-400' title='This training block is locked'>
                <LockIcon />
              </span>
            )}
          </h1>
        </div>
        <TrainingBlockNavigator />
      </div>

      {!selectedTrainingBlock && (
        <div className='bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg'>
          No training blocks yet. Use the + button above to create your first block.
        </div>
      )}

      {selectedTrainingBlock && (
        <>
          {error && <div className='mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>{error}</div>}

          {isLoading && (
            <div className='flex items-center justify-center min-h-[50vh]'>
              <LoadingIcon className='h-8 w-8 animate-spin text-gray-400' />
            </div>
          )}

          {!isLoading && displayPlan && (
            <div className='space-y-8'>
              {displayPlan.weeks.map((week) => (
                <section
                  key={week.weekNumber}
                  ref={week.weekNumber === scrollToWeekNumber ? currentWeekRef : undefined}
                  className={week.weekNumber === scrollToWeekNumber ? 'scroll-mt-6' : undefined}
                >
                  <div className='mb-2 flex flex-wrap items-center gap-3'>
                    <h3 className='font-semibold text-gray-900'>Week {week.weekNumber}</h3>
                    <WeekStory
                      week={week}
                      blockId={displayPlan.block.id}
                      locked={displayPlan.block.locked}
                      onPlanUpdated={(updated) => setPlan(normalizePlanWeeks(updated))}
                    />
                  </div>
                  <BlockPlanGrid
                    week={week}
                    blockId={displayPlan.block.id}
                    locked={displayPlan.block.locked}
                    onPlanUpdated={(updated) => setPlan(normalizePlanWeeks(updated))}
                    onActivityClick={handleActivityClick}
                  />
                </section>
              ))}
            </div>
          )}

          <div className='mt-8 flex justify-end'>
            <button
              type='button'
              onClick={() => syncAndLoadPlan(selectedTrainingBlock)}
              disabled={isLoading}
              className='text-sm px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50'
            >
              Refresh
            </button>
          </div>
        </>
      )}

      {selectedActivity && (
        <ActivityModal activity={selectedActivity} onClose={() => setSelectedActivity(null)} onUpdated={refreshPlan} />
      )}
    </div>
  );
}

function WeekStory({
  week,
  blockId,
  locked,
  onPlanUpdated,
}: {
  week: TrainingBlockPlan['weeks'][number];
  blockId: string;
  locked: boolean;
  onPlanUpdated: (plan: TrainingBlockPlan) => void;
}) {
  const [saving, setSaving] = useState(false);

  return (
    <label className='flex min-w-[200px] flex-1 items-center gap-2'>
      <span className='text-xs text-gray-500'>Story</span>
      <input
        type='text'
        defaultValue={week.story ?? ''}
        disabled={saving || locked}
        readOnly={locked}
        onKeyDown={blurOnEnter}
        onBlur={async (e) => {
          const v = e.target.value.trim() || null;
          if (v === (week.story ?? null)) return;
          setSaving(true);
          try {
            onPlanUpdated(await updateTrainingWeek(blockId, week.weekNumber, { story: v }));
          } finally {
            setSaving(false);
          }
        }}
        className='flex-1 rounded border border-gray-200 px-2 py-1 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400'
      />
    </label>
  );
}

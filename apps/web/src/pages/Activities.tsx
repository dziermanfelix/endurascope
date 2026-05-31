import { useState } from 'react';
import { ActivityCard } from '../components/ActivityCard';
import { useActivities } from '../contexts/ActivitiesContext';
import { Activity } from '../types/activity';
import { ActivityModal } from '../components/ActivityModal';
import { useSelectedTrainingBlock } from '../contexts/SelectedTrainingBlockContext';
import { filterActivitiesByBlock } from '../util/trainingBlock';
import { TrainingBlockSelector } from '../components/TrainingBlockSelector';
import { updateActivityName } from '../api/activities';
import { getBlockRunActivities, planMorningRunRenames } from '../util/activityName';

export function Activities() {
  const { activities, isLoading, isError, refetch, isRefetching, loadActivities } = useActivities();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameMessage, setRenameMessage] = useState('');
  const { selectedTrainingBlock } = useSelectedTrainingBlock();

  const filteredActivities = filterActivitiesByBlock(activities, selectedTrainingBlock);
  const blockRuns = selectedTrainingBlock
    ? getBlockRunActivities(filteredActivities, selectedTrainingBlock.identifier)
    : [];
  const renamePlan = selectedTrainingBlock
    ? planMorningRunRenames(filteredActivities, selectedTrainingBlock.identifier)
    : [];

  const handleRenameMorningRuns = async () => {
    if (renamePlan.length === 0) return;

    setIsRenaming(true);
    setRenameMessage('');

    const totalCount = renamePlan.length;
    let renamed = 0;

    try {
      for (const { activity, newName } of renamePlan) {
        await updateActivityName(activity.stravaId.toString(), newName);
        renamed++;
      }

      await loadActivities();
      setRenameMessage(`Updated ${renamed} run name${renamed === 1 ? '' : 's'}.`);
    } catch {
      setRenameMessage(
        renamed > 0 ? `Updated ${renamed} of ${totalCount} before an error occurred.` : 'Failed to update run names.',
      );
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold text-gray-900'>Activities</h2>
        <TrainingBlockSelector />
      </div>

      {!isLoading && !isError && (
        <div className='mb-4 flex justify-left'>
          <button
            onClick={async () => await refetch()}
            disabled={isRefetching}
            className='bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200'
          >
            {isRefetching ? 'Refetching...' : 'Refetch from Strava'}
          </button>
        </div>
      )}

      {isLoading && (
        <div className='flex justify-center items-center py-12'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      )}

      {isError && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6'>
          <p className='font-semibold'>Error loading activities</p>
          <p>Please try again later.</p>
        </div>
      )}

      {!isLoading && !isError && activities.length === 0 && (
        <div className='bg-white rounded-lg shadow-md p-8 text-center'>
          <p className='text-gray-600 text-lg'>No activities found.</p>
          <p className='text-gray-500 mt-2'>Fetch some activities from Strava to see them here.</p>
        </div>
      )}

      {!isLoading && !isError && activities.length > 0 && (
        <>
          <div className='grid grid-cols-1 gap-2 items-stretch'>
            {filteredActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onCardClick={(activity) => setSelectedActivity(activity)}
              />
            ))}
          </div>

          <div className='mt-6 flex flex-col items-start gap-2'>
            <button
              onClick={handleRenameMorningRuns}
              disabled={isRenaming || !selectedTrainingBlock || renamePlan.length === 0}
              className='bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200'
            >
              {isRenaming ? 'Renaming...' : `Correct Activity Names (${renamePlan.length})`}
            </button>
            {!selectedTrainingBlock && (
              <p className='text-sm text-gray-500'>Select a training block to renumber runs.</p>
            )}
            {selectedTrainingBlock && blockRuns.length === 0 && (
              <p className='text-sm text-gray-500'>No Morning Run or numbered run activities in this training block.</p>
            )}
            {selectedTrainingBlock && blockRuns.length > 0 && renamePlan.length === 0 && (
              <p className='text-sm text-gray-500'>Block runs are already numbered sequentially.</p>
            )}
            {renameMessage && <p className='text-sm text-gray-600'>{renameMessage}</p>}
          </div>
        </>
      )}

      {selectedActivity && <ActivityModal activity={selectedActivity} onClose={() => setSelectedActivity(null)} />}
    </>
  );
}

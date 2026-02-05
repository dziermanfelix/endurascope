import { useState } from 'react';
import { ActivityCard } from '../components/ActivityCard';
import { useActivities } from '../contexts/ActivitiesContext';
import { Activity } from '../types/activity';
import { ActivityModal } from '../components/ActivityModal';
import { useTrainingBlocks } from '../contexts/TrainingBlocksContext';

export function Activities() {
  const { activities, isLoading, isError, refetch, isRefetching } = useActivities();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedTrainingBlockId, setSelectedTrainingBlockId] = useState<string | null>(null);
  const { trainingBlocks } = useTrainingBlocks();

  const filteredActivities = selectedTrainingBlockId
    ? activities.filter((activity) => activity.name?.toLowerCase().startsWith(selectedTrainingBlockId.toLowerCase()))
    : activities;

  return (
    <>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold text-gray-900'>Activities</h2>
        <div className='w-1/4 min-w-[180px]'>
          <select
            className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer'
            value={selectedTrainingBlockId ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedTrainingBlockId(value === '' ? null : value);
            }}
          >
            <option value=''>All Training Blocks</option>
            {trainingBlocks.map((tb) => (
              <option key={tb.id} value={tb.identifier}>
                {tb.identifier}
              </option>
            ))}
          </select>
        </div>
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
        <div className='grid grid-cols-1 gap-2 items-stretch'>
          {filteredActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onCardClick={(activity) => setSelectedActivity(activity)}
            />
          ))}
        </div>
      )}

      {/* Activity Detail Modal */}
      {selectedActivity && <ActivityModal activity={selectedActivity} onClose={() => setSelectedActivity(null)} />}
    </>
  );
}

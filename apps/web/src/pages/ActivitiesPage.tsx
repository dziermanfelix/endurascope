import { ActivityCard } from '../components/ActivityCard';
import { useActivities } from '../contexts/ActivitiesContext';

export function ActivitiesPage() {
  const { activities, loadActivities, isLoading, isError, refetch, isRefetching } = useActivities();

  return (
    <>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold text-gray-900'>Activities</h2>
        <button
          onClick={async () => {
            await refetch();
          }}
          disabled={isRefetching || isLoading}
          className='bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200 flex items-center gap-2 hover:cursor-pointer'
        >
          {isRefetching ? 'Refetching...' : 'Refetch'}
        </button>
      </div>

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
        <div className='mb-4'>
          <p className='text-gray-600'>
            Showing <span className='font-semibold'>{activities.length}</span> activities
          </p>
        </div>
      )}

      {!isLoading && !isError && activities.length > 0 && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} onUpdate={loadActivities} />
          ))}
        </div>
      )}
    </>
  );
}

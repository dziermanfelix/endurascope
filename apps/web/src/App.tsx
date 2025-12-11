import { useEffect, useState } from 'react';
import type { Activity } from './types/activity';
import { ActivityCard } from './components/ActivityCard';
import { fetchActivities, refetchActivitiesFromStrava } from './api/activities';

function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchMessage, setRefetchMessage] = useState<string | null>(null);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await fetchActivities();
      setActivities(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
      console.error('Error loading activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const handleRefetch = async () => {
    try {
      setRefetching(true);
      setRefetchMessage(null);
      const result = await refetchActivitiesFromStrava();
      setRefetchMessage(
        `Successfully fetched ${result.fetched} activities from Strava! Total in database: ${result.total}`
      );
      // Reload activities after refetching
      await loadActivities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refetch activities');
      console.error('Error refetching activities:', err);
    } finally {
      setRefetching(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <header className='mb-8'>
          <div className='flex justify-between items-center'>
            <div>
              <h1 className='text-4xl font-bold text-gray-900 mb-2'>Endurascope</h1>
              <p className='text-gray-600'>Your Strava activities</p>
            </div>
            <button
              onClick={handleRefetch}
              disabled={refetching || loading}
              className='bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200 flex items-center gap-2 hover:cursor-pointer'
            >
              {refetching ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                  Refetching...
                </>
              ) : (
                <>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={2}
                    stroke='currentColor'
                    className='w-5 h-5'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99'
                    />
                  </svg>
                  Refetch from Strava
                </>
              )}
            </button>
          </div>
        </header>

        {refetchMessage && (
          <div className='bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6'>
            <p>{refetchMessage}</p>
          </div>
        )}

        {loading && (
          <div className='flex justify-center items-center py-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
          </div>
        )}

        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6'>
            <p className='font-semibold'>Error loading activities</p>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && activities.length === 0 && (
          <div className='bg-white rounded-lg shadow-md p-8 text-center'>
            <p className='text-gray-600 text-lg'>No activities found.</p>
            <p className='text-gray-500 mt-2'>Fetch some activities from Strava to see them here.</p>
          </div>
        )}

        {!loading && !error && activities.length > 0 && (
          <div className='mb-4'>
            <p className='text-gray-600'>
              Showing <span className='font-semibold'>{activities.length}</span> activities
            </p>
          </div>
        )}

        {!loading && !error && activities.length > 0 && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} onUpdate={loadActivities} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

import { useState } from 'react';
import { useActivities } from '../contexts/ActivitiesContext';
import type { RefetchActivitiesResult } from '../api/activities';

export function Admin() {
  const { refetch, isRefetching } = useActivities();
  const [lastResult, setLastResult] = useState<RefetchActivitiesResult | null>(null);

  const handleFetchComplete = async () => {
    const confirmed = window.confirm(
      'Fetch complete will re-download your entire Strava activity history. This may take a while and uses many API calls. Continue?',
    );
    if (!confirmed) return;

    const result = await refetch({ full: true });
    if (result) {
      setLastResult(result);
    }
  };

  return (
    <>
      <h2 className='text-2xl font-bold text-gray-900 mb-6'>Admin</h2>

      <section className='bg-white rounded-lg shadow-md p-6 max-w-lg'>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>Strava sync</h3>
        <p className='text-sm text-gray-600 mb-4'>
          Re-download all activities from Strava and update the local database. Use this if data is stale or after
          changing activities on Strava.
        </p>
        <button
          onClick={handleFetchComplete}
          disabled={isRefetching}
          className='bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200'
        >
          {isRefetching ? 'Fetching...' : 'Fetch complete'}
        </button>
        {lastResult && (
          <p className='text-sm text-gray-600 mt-4'>
            Last sync ({lastResult.mode}): {lastResult.fetched} fetched from Strava, {lastResult.created} created,{' '}
            {lastResult.updated} updated ({lastResult.total} runs total).
          </p>
        )}
      </section>
    </>
  );
}

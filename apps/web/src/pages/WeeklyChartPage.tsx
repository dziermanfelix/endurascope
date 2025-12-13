import { useEffect, useState } from 'react';
import type { Activity } from '../types/activity';
import { WeeklyChart } from '../components/WeeklyChart';
import { fetchActivities } from '../api/activities';

export function WeeklyChartPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    loadActivities();
  }, []);

  if (loading) {
    return (
      <div className='flex justify-center items-center py-12'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
        <p className='font-semibold'>Error loading activities</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <h2 className='text-2xl font-bold text-gray-900 mb-6'>Weekly Training Progress</h2>
      <WeeklyChart activities={activities} />
    </>
  );
}

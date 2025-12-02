import { useEffect, useState } from 'react';
import type { Activity } from './types/activity';
import { ActivityCard } from './components/ActivityCard';
import { fetchActivities } from './api/activities';

function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadActivities() {
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
    }

    loadActivities();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Endurascope</h1>
          <p className="text-gray-600">Your Strava activities</p>
        </header>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-semibold">Error loading activities</p>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && activities.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 text-lg">No activities found.</p>
            <p className="text-gray-500 mt-2">Fetch some activities from Strava to see them here.</p>
          </div>
        )}

        {!loading && !error && activities.length > 0 && (
          <div className="mb-4">
            <p className="text-gray-600">
              Showing <span className="font-semibold">{activities.length}</span> activities
            </p>
          </div>
        )}

        {!loading && !error && activities.length > 0 && (
          <div className="grid gap-6">
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

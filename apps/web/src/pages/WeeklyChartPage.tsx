import { useEffect, useState } from 'react';
import type { Activity } from '../types/activity';
import { WeeklyChart } from '../components/WeeklyChart';
import { fetchActivities } from '../api/activities';
import { fetchTrainingBlocks, type TrainingBlock } from '../api/training-blocks';
import { CreateTrainingBlockModal } from '../components/CreateTrainingBlockModal';

export function WeeklyChartPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [trainingBlocks, setTrainingBlocks] = useState<TrainingBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [activitiesData, trainingBlocksData] = await Promise.all([fetchActivities(), fetchTrainingBlocks()]);
        setActivities(activitiesData);
        setTrainingBlocks(trainingBlocksData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
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
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold text-gray-900'>Weekly Training Progress</h2>
      </div>
      <WeeklyChart activities={activities} trainingBlocks={trainingBlocks} />

      <CreateTrainingBlockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={async () => {
          // Reload training blocks after creation
          try {
            const updatedBlocks = await fetchTrainingBlocks();
            setTrainingBlocks(updatedBlocks);
          } catch (err) {
            console.error('Error reloading training blocks:', err);
          }
        }}
      />
    </>
  );
}

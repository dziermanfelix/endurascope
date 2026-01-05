import { useEffect, useState } from 'react';
import { WeeklyChart } from '../components/WeeklyChart';
import { fetchTrainingBlocks, type TrainingBlock } from '../api/training-blocks';
import { CreateTrainingBlockModal } from '../components/CreateTrainingBlockModal';
import { useActivities } from '../contexts/ActivitiesContext';

export function WeeklyChartPage() {
  const { activities, isLoading: isActivitiesLoading, isError: isActivitiesError } = useActivities();
  const [trainingBlocks, setTrainingBlocks] = useState<TrainingBlock[]>([]);
  const [isTrainingBlocksLoading, setIsTrainingBlocksLoading] = useState(true);
  const [isTrainingBlocksError, setIsTrainingBlocksError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsTrainingBlocksLoading(true);
        const [trainingBlocksData] = await Promise.all([fetchTrainingBlocks()]);
        setTrainingBlocks(trainingBlocksData);
        setIsTrainingBlocksError(false);
      } catch (err) {
        setIsTrainingBlocksError(true);
        console.error('Error loading data:', err);
      } finally {
        setIsTrainingBlocksLoading(false);
      }
    };

    loadData();
  }, []);

  if (isActivitiesLoading || isTrainingBlocksLoading) {
    return (
      <div className='flex justify-center items-center py-12'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (isActivitiesError || isTrainingBlocksError) {
    return (
      <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
        <p className='font-semibold'>Error loading data</p>
        <p>{isActivitiesError || isTrainingBlocksError}</p>
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

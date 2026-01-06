import { useState } from 'react';
import { deleteTrainingBlock, TrainingBlock } from '../api/training-blocks';
import { CreateTrainingBlockModal } from '../components/CreateTrainingBlockModal';
import { EditTrainingBlockModal } from '../components/EditTrainingBlockModal';
import CreateIcon from '../components/CreateIcon';
import { useTrainingBlocks } from '../contexts/TrainingBlocksContext';

export function ManageTrainingBlocksPage() {
  const { trainingBlocks, loadTrainingBlocks, isLoading, isError } = useTrainingBlocks();
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<TrainingBlock | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleEdit = (block: TrainingBlock) => {
    setSelectedBlock(block);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTrainingBlock(id);
      await loadTrainingBlocks();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete training block');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateWeeksRemaining = (raceDate: Date) => {
    const now = new Date();
    const race = new Date(raceDate);
    const diffTime = race.getTime() - now.getTime();
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center py-12'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold text-gray-900'>Manage Training Blocks</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className='px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center gap-2 hover:cursor-pointer'
        >
          <CreateIcon />
          Training Block
        </button>
      </div>

      {isError && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6'>
          <p className='font-semibold'>Error</p>
          <p>{error}</p>
        </div>
      )}

      {!isLoading && trainingBlocks.length === 0 && (
        <div className='bg-white rounded-lg shadow-md p-8 text-center'>
          <p className='text-gray-600 text-lg'>No training blocks found.</p>
          <p className='text-gray-500 mt-2'>Create your first training block to get started.</p>
        </div>
      )}

      {!isLoading && trainingBlocks.length > 0 && (
        <div className='space-y-4'>
          {trainingBlocks.map((block) => {
            const weeksRemaining = calculateWeeksRemaining(block.raceDate);
            const isPast = weeksRemaining < 0;

            return (
              <div key={block.id} className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow'>
                <div className='flex justify-between items-start'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-2'>
                      <h3 className='text-xl font-bold text-gray-900'>{block.raceName}</h3>
                      <span className='px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded'>
                        {block.identifier}
                      </span>
                      {isPast && (
                        <span className='px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded'>
                          Completed
                        </span>
                      )}
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4'>
                      <div>
                        <p className='text-sm text-gray-500'>Start Date</p>
                        <p className='font-semibold text-gray-900'>{formatDate(block.startDate)}</p>
                      </div>
                      <div>
                        <p className='text-sm text-gray-500'>Race Date</p>
                        <p className='font-semibold text-gray-900'>{formatDate(block.raceDate)}</p>
                      </div>
                      <div>
                        <p className='text-sm text-gray-500'>Duration</p>
                        <p className='font-semibold text-gray-900'>{block.durationWeeks} weeks</p>
                      </div>
                      <div>
                        <p className='text-sm text-gray-500'>{isPast ? 'Race was' : 'Weeks until race'}</p>
                        <p className={`font-semibold ${isPast ? 'text-gray-600' : 'text-orange-600'}`}>
                          {isPast ? `${Math.abs(weeksRemaining)} weeks ago` : `${weeksRemaining} weeks`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='flex gap-2 ml-4'>
                    <button
                      onClick={() => handleEdit(block)}
                      className='p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors'
                      title='Edit'
                    >
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                        />
                      </svg>
                    </button>
                    {deleteConfirm === block.id ? (
                      <div className='flex gap-1'>
                        <button
                          onClick={() => handleDelete(block.id)}
                          className='px-3 py-2 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors'
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className='px-3 py-2 text-xs bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors'
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(block.id)}
                        className='p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors'
                        title='Delete'
                      >
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateTrainingBlockModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadTrainingBlocks}
      />

      <EditTrainingBlockModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedBlock(null);
        }}
        onSuccess={loadTrainingBlocks}
        trainingBlock={selectedBlock}
      />
    </>
  );
}

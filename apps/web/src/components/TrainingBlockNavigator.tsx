import { useMemo, useState } from 'react';
import { CreateTrainingBlockModal } from './CreateTrainingBlockModal';
import { EditTrainingBlockModal } from './EditTrainingBlockModal';
import CreateIcon from '../icons/CreateIcon';
import { useTrainingBlocks } from '../contexts/TrainingBlocksContext';
import { useSelectedTrainingBlock } from '../contexts/SelectedTrainingBlockContext';
import { byStartDateDesc } from '../util/trainingBlock';
import type { TrainingBlock } from '../api/training-blocks';

function ChevronLeftIcon() {
  return (
    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden>
      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden>
      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
    </svg>
  );
}

export function TrainingBlockNavigator() {
  const { trainingBlocks, loadTrainingBlocks } = useTrainingBlocks();
  const { selectedTrainingBlock, setSelectedTrainingBlock } = useSelectedTrainingBlock();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const sortedBlocks = useMemo(() => [...trainingBlocks].sort(byStartDateDesc), [trainingBlocks]);
  const currentIndex = selectedTrainingBlock
    ? sortedBlocks.findIndex((block) => block.id === selectedTrainingBlock.id)
    : -1;

  const hasOlder = currentIndex >= 0 && currentIndex < sortedBlocks.length - 1;
  const hasNewer = currentIndex > 0;

  const selectBlock = (block: TrainingBlock) => {
    setSelectedTrainingBlock(block);
  };

  const handleCreated = async (block?: TrainingBlock) => {
    await loadTrainingBlocks();
    if (block) {
      setSelectedTrainingBlock(block);
    }
  };

  const handleEdited = async (block: TrainingBlock) => {
    setSelectedTrainingBlock(block);
    await loadTrainingBlocks();
  };

  return (
    <>
      <div className='flex items-center gap-2'>
        {selectedTrainingBlock && (
          <button
            type='button'
            onClick={() => setIsEditModalOpen(true)}
            className='px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700'
          >
            Edit
          </button>
        )}

        <button
          type='button'
          onClick={() => {
            if (!hasOlder) return;
            selectBlock(sortedBlocks[currentIndex + 1]);
          }}
          disabled={!hasOlder}
          className='p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent'
          aria-label='Previous training block'
          title='Older block'
        >
          <ChevronLeftIcon />
        </button>

        {hasNewer ? (
          <button
            type='button'
            onClick={() => selectBlock(sortedBlocks[currentIndex - 1])}
            className='p-2 border border-gray-300 rounded-md hover:bg-gray-50'
            aria-label='Next training block'
            title='Newer block'
          >
            <ChevronRightIcon />
          </button>
        ) : (
          <button
            type='button'
            onClick={() => setIsCreateModalOpen(true)}
            className='p-2 border border-gray-300 rounded-md hover:bg-gray-50 text-orange-600'
            aria-label='Add training block'
            title='Add training block'
          >
            <CreateIcon />
          </button>
        )}
      </div>

      <CreateTrainingBlockModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreated}
      />

      <EditTrainingBlockModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEdited}
        trainingBlock={selectedTrainingBlock}
      />
    </>
  );
}

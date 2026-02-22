import { useTrainingBlocks } from '../contexts/TrainingBlocksContext';
import { useSelectedTrainingBlock } from '../contexts/SelectedTrainingBlockContext';

export function TrainingBlockSelector() {
  const { trainingBlocks } = useTrainingBlocks();
  const { selectedTrainingBlock, setSelectedTrainingBlock } = useSelectedTrainingBlock();

  return (
    <div className='w-1/4 min-w-[180px]'>
      <select
        className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer'
        value={selectedTrainingBlock?.identifier ?? ''}
        onChange={(e) => {
          const identifier = e.target.value;
          const block = identifier === '' ? null : (trainingBlocks.find((tb) => tb.identifier === identifier) ?? null);
          setSelectedTrainingBlock(block);
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
  );
}

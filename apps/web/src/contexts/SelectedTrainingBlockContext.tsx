import { ReactNode, createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { TrainingBlock } from '../api/training-blocks';
import { byStartDateDesc } from '../util/trainingBlock';
import { useTrainingBlocks } from './TrainingBlocksContext';

const STORAGE_KEY = 'endurascope_selected_block';

function pickDefaultBlock(blocks: TrainingBlock[]): TrainingBlock | null {
  if (blocks.length === 0) return null;
  return [...blocks].sort(byStartDateDesc)[0];
}

function persistBlock(block: TrainingBlock | null) {
  if (typeof localStorage === 'undefined') return;
  if (block) {
    localStorage.setItem(STORAGE_KEY, block.identifier);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

interface SelectedTrainingBlockContextType {
  selectedTrainingBlock: TrainingBlock | null;
  setSelectedTrainingBlock: (block: TrainingBlock | null) => void;
}

const SelectedTrainingBlockContext = createContext<SelectedTrainingBlockContextType | null>(null);

export function SelectedTrainingBlockProvider({ children }: { children: ReactNode }) {
  const { trainingBlocks } = useTrainingBlocks();
  const [selectedTrainingBlock, setSelectedTrainingBlockState] = useState<TrainingBlock | null>(null);
  const [hasRestored, setHasRestored] = useState(false);

  useEffect(() => {
    if (trainingBlocks.length === 0) return;
    if (hasRestored) return;

    if (typeof localStorage === 'undefined') {
      setHasRestored(true);
      return;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    const identifier = stored?.trim() ?? '';
    const storedBlock = identifier
      ? (trainingBlocks.find((tb) => tb.identifier.toLowerCase() === identifier.toLowerCase()) ?? null)
      : null;
    const block = storedBlock ?? pickDefaultBlock(trainingBlocks);

    setSelectedTrainingBlockState(block);
    persistBlock(block);
    setHasRestored(true);
  }, [trainingBlocks, hasRestored]);

  const setSelectedTrainingBlock = useCallback((block: TrainingBlock | null) => {
    setSelectedTrainingBlockState(block);
    persistBlock(block);
  }, []);

  return (
    <SelectedTrainingBlockContext.Provider value={{ selectedTrainingBlock, setSelectedTrainingBlock }}>
      {children}
    </SelectedTrainingBlockContext.Provider>
  );
}

export function useSelectedTrainingBlock() {
  const context = useContext(SelectedTrainingBlockContext);
  if (!context) {
    throw new Error('useSelectedTrainingBlock must be used within a SelectedTrainingBlockProvider');
  }
  return context;
}

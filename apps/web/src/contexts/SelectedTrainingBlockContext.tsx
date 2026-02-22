import { ReactNode, createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { TrainingBlock } from '../api/training-blocks';
import { useTrainingBlocks } from './TrainingBlocksContext';

const STORAGE_KEY = 'endurascope_selected_block';

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
    if (!identifier) {
      setHasRestored(true);
      return;
    }

    const block = trainingBlocks.find((tb) => tb.identifier.toLowerCase() === identifier.toLowerCase()) ?? null;
    setSelectedTrainingBlockState(block);
    if (!block && identifier) {
      localStorage.removeItem(STORAGE_KEY);
    }
    setHasRestored(true);
  }, [trainingBlocks, hasRestored]);

  const setSelectedTrainingBlock = useCallback((block: TrainingBlock | null) => {
    setSelectedTrainingBlockState(block);
    if (typeof localStorage !== 'undefined') {
      const value = block ? block.identifier : '';
      if (value) {
        localStorage.setItem(STORAGE_KEY, value);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
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

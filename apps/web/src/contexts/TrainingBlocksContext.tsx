import { ReactNode, createContext, useContext, useState, useEffect, Dispatch, SetStateAction } from 'react';
import { TrainingBlock, fetchTrainingBlocks } from '../api/training-blocks';

interface TrainingBlocksProviderProps {
  children: ReactNode;
}

interface TrainingBlocksContextType {
  trainingBlocks: TrainingBlock[];
  setTrainingBlocks: Dispatch<SetStateAction<TrainingBlock[]>>;
  loadTrainingBlocks: () => Promise<void>;
  isLoading: boolean;
  isError: boolean;
}

const TrainingBlocksContext = createContext<TrainingBlocksContextType | null>(null);

export const TrainingBlocksProvider = ({ children }: TrainingBlocksProviderProps) => {
  const [trainingBlocks, setTrainingBlocks] = useState<TrainingBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const loadTrainingBlocks = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const data = await fetchTrainingBlocks();
      setTrainingBlocks(data);
    } catch (err) {
      setIsError(true);
      console.error('Error loading training blocks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrainingBlocks();
  }, []);

  return (
    <TrainingBlocksContext.Provider
      value={{
        trainingBlocks,
        setTrainingBlocks,
        loadTrainingBlocks,
        isLoading,
        isError,
      }}
    >
      {children}
    </TrainingBlocksContext.Provider>
  );
};

export const useTrainingBlocks = () => {
  const context = useContext(TrainingBlocksContext);
  if (!context) throw new Error('useTrainingBlocks must be used within a TrainingBlocksProvider');
  return context;
};

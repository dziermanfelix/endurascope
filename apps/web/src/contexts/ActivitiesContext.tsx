import { ReactNode, createContext, useContext, useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Activity } from '../types/activity';
import { fetchActivities, refetchActivitiesFromStrava } from '../api/activities';

interface ActivitiesProviderProps {
  children: ReactNode;
}

interface ActivitesContextType {
  activities: Activity[];
  setActivities: Dispatch<SetStateAction<Activity[]>>;
  loadActivities: () => Promise<void>;
  isLoading: boolean;
  refetch: () => Promise<{ fetched: number; total: number } | null>;
  isRefetching: boolean;
  isError: boolean;
}

const ActivitiesContext = createContext<ActivitesContextType | null>(null);

export const ActivitiesProvider = ({ children }: ActivitiesProviderProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const data = await fetchActivities();
      setActivities(data);
    } catch (err) {
      setIsError(true);
      console.error('Error loading activities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = async () => {
    try {
      setIsRefetching(true);
      setIsError(false);
      const result = await refetchActivitiesFromStrava();
      await loadActivities();
      return result;
    } catch (err) {
      setIsError(true);
      console.error('Error refetching activities:', err);
      return null;
    } finally {
      setIsRefetching(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  return (
    <ActivitiesContext.Provider
      value={{
        activities,
        setActivities,
        loadActivities,
        isLoading,
        refetch,
        isRefetching,
        isError,
      }}
    >
      {children}
    </ActivitiesContext.Provider>
  );
};

export const useActivities = () => {
  const context = useContext(ActivitiesContext);
  if (!context) throw new Error('useActivities must be used within a ActivitiesProvider');
  return context;
};

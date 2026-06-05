import { ReactNode, createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Activity } from '../types/activity';
import { fetchActivities, refetchActivitiesFromStrava, type RefetchActivitiesResult } from '../api/activities';

interface ActivitiesProviderProps {
  children: ReactNode;
}

interface ActivitiesContextType {
  activities: Activity[];
  loadActivities: () => Promise<void>;
  isLoading: boolean;
  refetch: (options?: { full?: boolean }) => Promise<RefetchActivitiesResult | null>;
  isRefetching: boolean;
  isError: boolean;
}

const ActivitiesContext = createContext<ActivitiesContextType | null>(null);

export const ActivitiesProvider = ({ children }: ActivitiesProviderProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

  const loadActivities = useCallback(async () => {
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
  }, []);

  const refetch = useCallback(async (options?: { full?: boolean }) => {
    try {
      setIsRefetching(true);
      setIsError(false);
      const result = await refetchActivitiesFromStrava(options);
      const data = await fetchActivities();
      setActivities(data);
      return result;
    } catch (err) {
      setIsError(true);
      console.error('Error refetching activities:', err);
      return null;
    } finally {
      setIsRefetching(false);
    }
  }, [loadActivities]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const value = useMemo(
    () => ({
      activities,
      loadActivities,
      isLoading,
      refetch,
      isRefetching,
      isError,
    }),
    [activities, isLoading, isRefetching, isError, loadActivities, refetch],
  );

  return <ActivitiesContext.Provider value={value}>{children}</ActivitiesContext.Provider>;
};

export const useActivities = () => {
  const context = useContext(ActivitiesContext);
  if (!context) throw new Error('useActivities must be used within a ActivitiesProvider');
  return context;
};

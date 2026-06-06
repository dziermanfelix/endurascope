import { ReactNode, createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Activity } from '../types/activity';
import { fetchActivities, refetchActivitiesFromStrava, type RefetchActivitiesResult } from '../api/activities';

interface ActivitiesProviderProps {
  children: ReactNode;
}

interface ActivitiesContextType {
  activities: Activity[];
  loadActivities: () => Promise<void>;
  refetch: (options?: { full?: boolean }) => Promise<RefetchActivitiesResult | null>;
  isRefetching: boolean;
}

const ActivitiesContext = createContext<ActivitiesContextType | null>(null);

export const ActivitiesProvider = ({ children }: ActivitiesProviderProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isRefetching, setIsRefetching] = useState(false);

  const loadActivities = useCallback(async () => {
    try {
      const data = await fetchActivities();
      setActivities(data);
    } catch (err) {
      console.error('Error loading activities:', err);
    }
  }, []);

  const refetch = useCallback(async (options?: { full?: boolean }) => {
    try {
      setIsRefetching(true);
      const result = await refetchActivitiesFromStrava(options);
      const data = await fetchActivities();
      setActivities(data);
      return result;
    } catch (err) {
      console.error('Error refetching activities:', err);
      return null;
    } finally {
      setIsRefetching(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const value = useMemo(
    () => ({
      activities,
      loadActivities,
      refetch,
      isRefetching,
    }),
    [activities, isRefetching, loadActivities, refetch],
  );

  return <ActivitiesContext.Provider value={value}>{children}</ActivitiesContext.Provider>;
};

export const useActivities = () => {
  const context = useContext(ActivitiesContext);
  if (!context) throw new Error('useActivities must be used within a ActivitiesProvider');
  return context;
};

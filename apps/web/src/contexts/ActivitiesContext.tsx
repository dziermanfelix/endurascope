import { ReactNode, createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Activity } from '../types/activity';
import type { DayData, WeekSummary } from '../util/week';
import { getWeekStart, getWeekDataForStart } from '../util/week';
import { fetchActivities, refetchActivitiesFromStrava } from '../api/activities';

interface ActivitiesProviderProps {
  children: ReactNode;
}

interface ActivitiesContextType {
  activities: Activity[];
  loadActivities: () => Promise<void>;
  isLoading: boolean;
  refetch: () => Promise<{ fetched: number; total: number } | null>;
  isRefetching: boolean;
  isError: boolean;
  availableWeeks: Date[];
  getWeekData: (weekStart: Date) => { days: DayData[]; summary: WeekSummary };
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

  const refetch = useCallback(async () => {
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
  }, [loadActivities]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const availableWeeks = useMemo(() => {
    const weekStarts = new Set<string>();
    activities.forEach((activity) => {
      if (!activity.startDateLocal) return;
      const weekStart = getWeekStart(new Date(activity.startDateLocal));
      weekStarts.add(weekStart.toISOString());
    });
    return Array.from(weekStarts)
      .map((iso) => new Date(iso))
      .sort((a, b) => b.getTime() - a.getTime());
  }, [activities]);

  const getWeekData = useCallback((weekStart: Date) => getWeekDataForStart(activities, weekStart), [activities]);

  const value = useMemo(
    () => ({
      activities,
      loadActivities,
      isLoading,
      refetch,
      isRefetching,
      isError,
      availableWeeks,
      getWeekData,
    }),
    [activities, isLoading, isRefetching, isError, loadActivities, refetch, availableWeeks, getWeekData],
  );

  return <ActivitiesContext.Provider value={value}>{children}</ActivitiesContext.Provider>;
};

export const useActivities = () => {
  const context = useContext(ActivitiesContext);
  if (!context) throw new Error('useActivities must be used within a ActivitiesProvider');
  return context;
};

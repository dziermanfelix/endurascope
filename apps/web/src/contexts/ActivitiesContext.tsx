import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  Dispatch,
  SetStateAction,
} from 'react';
import { Activity } from '../types/activity';
import { fetchActivities, refetchActivitiesFromStrava } from '../api/activities';

// --- Weekly types (Monday–Sunday) ---
export interface DayData {
  day: string;
  dayLabel: string;
  date: Date;
  miles: number;
  time: number;
}

export interface WeekSummary {
  totalRuns: number;
  totalMiles: number;
  totalCalories: number;
  totalTime: number;
  heartRateSum: number;
  heartRateCount: number;
  paceActivities: number;
}

export interface WeekSummaryItem {
  weekStart: Date;
  weekNumber: number;
  summary: WeekSummary;
}

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDataForStart(activities: Activity[], weekStart: Date): { days: DayData[]; summary: WeekSummary } {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const days: DayData[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    days.push({
      day: WEEKDAY_NAMES[i],
      dayLabel: `${WEEKDAY_NAMES[i]} ${date.getDate()}`,
      date: new Date(date),
      miles: 0,
      time: 0,
    });
  }

  const summary: WeekSummary = {
    totalRuns: 0,
    totalMiles: 0,
    totalCalories: 0,
    totalTime: 0,
    heartRateSum: 0,
    heartRateCount: 0,
    paceActivities: 0,
  };

  activities.forEach((activity) => {
    if (!activity.startDateLocal) return;

    const activityDate = new Date(activity.startDateLocal);
    activityDate.setHours(0, 0, 0, 0);

    if (activityDate >= weekStart && activityDate <= weekEnd) {
      const dayIndex = Math.floor((activityDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < 7) {
        summary.totalRuns += 1;
        if (activity.distance) {
          days[dayIndex].miles += activity.distance;
          summary.totalMiles += activity.distance;
        }
        if (activity.elapsedTime) {
          days[dayIndex].time += activity.elapsedTime;
          summary.totalTime += activity.elapsedTime;
        }
        if (activity.calories) summary.totalCalories += activity.calories;
        if (activity.averageHeartRate && activity.averageHeartRate > 0) {
          summary.heartRateSum += activity.averageHeartRate;
          summary.heartRateCount += 1;
        }
        if (
          activity.distance &&
          activity.distance > 0 &&
          activity.elapsedTime &&
          activity.elapsedTime > 0
        ) {
          summary.paceActivities += 1;
        }
      }
    }
  });

  return { days, summary };
}

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
  /** Week starts (Monday), most recent first. Always Monday–Sunday. */
  availableWeeks: Date[];
  /** Get day-by-day data and summary for a given week start (Monday). */
  getWeekData: (weekStart: Date) => { days: DayData[]; summary: WeekSummary };
  /** All weeks with summary, for summary tab. */
  weekSummaries: WeekSummaryItem[];
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

  const getWeekData = useCallback(
    (weekStart: Date) => getWeekDataForStart(activities, weekStart),
    [activities],
  );

  const weekSummaries = useMemo(() => {
    const numWeeks = availableWeeks.length;
    return availableWeeks.map((weekStart, index) => {
      const { summary } = getWeekDataForStart(activities, weekStart);
      return {
        weekStart,
        weekNumber: numWeeks - index,
        summary,
      };
    });
  }, [activities, availableWeeks]);

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
        availableWeeks,
        getWeekData,
        weekSummaries,
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

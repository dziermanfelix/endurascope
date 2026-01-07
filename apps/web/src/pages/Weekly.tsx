import { useState, useMemo } from 'react';
import { Activity } from '../types/activity';
import { formatTimeFromHours } from '../util/time';
import { useActivities } from '../contexts/ActivitiesContext';
import { ArrowIcon } from '../components/ArrowIcon';
import WeeklyChart from '../components/WeeklyChart';

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

// Get the start of the week (Monday) for a given date
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get all available week starts from activities
function getAvailableWeeks(activities: Activity[]): Date[] {
  const weekStarts = new Set<string>();

  activities.forEach((activity) => {
    if (!activity.startDateLocal) return;
    const date = new Date(activity.startDateLocal);
    const weekStart = getWeekStart(date);
    weekStarts.add(weekStart.toISOString());
  });

  return Array.from(weekStarts)
    .map((iso) => new Date(iso))
    .sort((a, b) => b.getTime() - a.getTime()); // Most recent first
}

// Get data for a specific week
function getWeekData(activities: Activity[], weekStart: Date): { days: DayData[]; summary: WeekSummary } {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Initialize all 7 days
  const days: DayData[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dayOfWeek = date.getDay();
    days.push({
      day: dayNames[dayOfWeek],
      dayLabel: `${dayNames[dayOfWeek]} ${date.getDate()}`,
      date: new Date(date),
      miles: 0,
      time: 0,
    });
  }

  // Initialize summary
  const summary: WeekSummary = {
    totalRuns: 0,
    totalMiles: 0,
    totalCalories: 0,
    totalTime: 0,
    heartRateSum: 0,
    heartRateCount: 0,
    paceActivities: 0,
  };

  // Process activities for the week
  activities.forEach((activity) => {
    if (!activity.startDateLocal) return;

    const activityDate = new Date(activity.startDateLocal);
    activityDate.setHours(0, 0, 0, 0);

    if (activityDate >= weekStart && activityDate <= weekEnd) {
      const dayIndex = Math.floor((activityDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < 7) {
        summary.totalRuns += 1;
        // Add to day miles
        if (activity.distance) {
          days[dayIndex].miles += activity.distance;
          summary.totalMiles += activity.distance;
        }

        // Add to day time
        if (activity.movingTime) {
          days[dayIndex].time += activity.movingTime;
          summary.totalTime += activity.movingTime;
        }

        // Add to weekly totals
        if (activity.calories) {
          summary.totalCalories += activity.calories;
        }

        // Track heart rate
        if (activity.averageHeartRate && activity.averageHeartRate > 0) {
          summary.heartRateSum += activity.averageHeartRate;
          summary.heartRateCount += 1;
        }

        // Track activities with both distance and time for pace calculation
        if (activity.distance && activity.distance > 0 && activity.movingTime && activity.movingTime > 0) {
          summary.paceActivities += 1;
        }
      }
    }
  });

  return { days, summary };
}

function getWeeklySummaries(
  activities: Activity[]
): Array<{ weekStart: Date; weekNumber: number; summary: WeekSummary }> {
  const weeks = getAvailableWeeks(activities);
  const numWeeks = weeks.length;
  return weeks.map((weekStart, index) => {
    const { summary } = getWeekData(activities, weekStart);
    return {
      weekStart,
      weekNumber: numWeeks - index,
      summary,
    };
  });
}

export function Weekly() {
  const { activities, isLoading: isActivitiesLoading, isError: isActivitiesError } = useActivities();

  const [activeTab, setActiveTab] = useState<'weekly' | 'summary'>('weekly');
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  const availableWeeks = useMemo(() => getAvailableWeeks(activities), [activities]);

  const currentWeekStart = availableWeeks[currentWeekIndex] ?? null;

  const weekDataResult = useMemo(() => {
    if (!currentWeekStart) {
      return { days: [], summary: null };
    }
    return getWeekData(activities, currentWeekStart);
  }, [activities, currentWeekStart]);

  const weekData = weekDataResult.days;
  const summary = weekDataResult.summary;

  // Get all week summaries for the selected training block
  const weekSummaries = useMemo(() => {
    return getWeeklySummaries(activities);
  }, [activities]);

  // Calculate average pace helper
  const calculateAveragePace = (summary: WeekSummary): string | null => {
    if (summary.totalMiles === 0 || summary.totalTime === 0) return null;
    const secondsPerMile = summary.totalTime / summary.totalMiles;
    const minutes = Math.floor(secondsPerMile / 60);
    const seconds = Math.floor(secondsPerMile % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const weekLabel = currentWeekStart
    ? `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(
        currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000
      ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : '';

  const goToPreviousWeek = () => {
    if (currentWeekIndex < availableWeeks.length - 1) {
      setCurrentWeekIndex(currentWeekIndex + 1);
    }
  };

  const goToNextWeek = () => {
    if (currentWeekIndex > 0) {
      setCurrentWeekIndex(currentWeekIndex - 1);
    }
  };

  if (summary === null) return;

  // Calculate derived metrics for weekly view
  const totalMiles = summary.totalMiles;
  const totalRuns = weekData.filter((d) => d.miles > 0).length;
  const avgMilesPerDay = totalRuns > 0 ? totalMiles / 7 : 0;
  const avgHeartRate = summary.heartRateCount > 0 ? summary.heartRateSum / summary.heartRateCount : null;
  const totalTimeHours = summary.totalTime / 3600;
  const averagePace = calculateAveragePace(summary);

  if (isActivitiesLoading) {
    return (
      <div className='flex justify-center items-center py-12'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (isActivitiesError) {
    return (
      <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
        <p className='font-semibold'>Error loading data</p>
        <p>{isActivitiesError}</p>
      </div>
    );
  }

  if (availableWeeks.length === 0 && activeTab === 'weekly') {
    return (
      <div className='bg-white rounded-lg shadow-md p-8 text-center'>
        <p className='text-gray-600 text-lg'>No activity data available for weekly breakdown.</p>
      </div>
    );
  }

  return (
    <>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold text-gray-900'>Weekly Training</h2>
      </div>
      <div className='space-y-6'>
        {/* Tabs */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 '>
          <div className='flex border-b border-gray-200 mb-4'>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'weekly'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:cursor-pointer'
              }`}
            >
              Weekly View
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'summary'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:cursor-pointer'
              }`}
            >
              Summary
            </button>
          </div>

          {activeTab === 'weekly' && (
            <>
              {/* Week Navigation */}
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <p className='text-gray-600'>{weekLabel}</p>
                </div>
                <div className='flex items-center gap-4'>
                  <button
                    onClick={goToPreviousWeek}
                    disabled={currentWeekIndex >= availableWeeks.length - 1}
                    className='px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 hover:cursor-pointer disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2'
                  >
                    <ArrowIcon direction='left' />
                    Previous
                  </button>
                  <span className='text-sm text-gray-500'>
                    Week {availableWeeks.length - currentWeekIndex} of {availableWeeks.length}
                  </span>
                  <button
                    onClick={goToNextWeek}
                    disabled={currentWeekIndex === 0}
                    className='px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 hover:cursor-pointer disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2'
                  >
                    Next
                    <ArrowIcon direction='right' />
                  </button>
                </div>
              </div>

              {/* Summary Stats */}
              <div className='space-y-4 mb-6'>
                {/* First row: Runs, Miles, Time, Avg Pace */}
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  <div className='bg-gray-50 rounded-lg p-4'>
                    <p className='text-sm text-gray-600'>Runs</p>
                    <p className='text-2xl font-bold text-gray-900'>{totalRuns}</p>
                  </div>
                  <div className='bg-gray-50 rounded-lg p-4'>
                    <p className='text-sm text-gray-600'>Miles</p>
                    <p className='text-2xl font-bold text-gray-900'>{totalMiles.toFixed(2)}</p>
                  </div>
                  {summary.totalTime > 0 && (
                    <div className='bg-gray-50 rounded-lg p-4'>
                      <p className='text-sm text-gray-600'>Time</p>
                      <p className='text-2xl font-bold text-gray-900'>{formatTimeFromHours(totalTimeHours)}</p>
                    </div>
                  )}
                  {averagePace !== null && (
                    <div className='bg-gray-50 rounded-lg p-4'>
                      <p className='text-sm text-gray-600'>Avg Pace</p>
                      <p className='text-2xl font-bold text-gray-900'>{averagePace} /mi</p>
                    </div>
                  )}
                </div>

                {/* Second row: Total Calories, Avg Heart Rate, Miles per Day */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  {avgHeartRate !== null && (
                    <div className='bg-gray-50 rounded-lg p-4'>
                      <p className='text-sm text-gray-600'>Avg Heart Rate</p>
                      <p className='text-2xl font-bold text-gray-900'>{Math.round(avgHeartRate)} bpm</p>
                    </div>
                  )}
                  {summary.totalCalories > 0 && (
                    <div className='bg-gray-50 rounded-lg p-4'>
                      <p className='text-sm text-gray-600'>Calories</p>
                      <p className='text-2xl font-bold text-gray-900'>
                        {Math.round(summary.totalCalories).toLocaleString()}
                      </p>
                    </div>
                  )}
                  <div className='bg-gray-50 rounded-lg p-4'>
                    <p className='text-sm text-gray-600'>Miles Per Day</p>
                    <p className='text-2xl font-bold text-gray-900'>{avgMilesPerDay.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <WeeklyChart weekData={weekData} />
            </>
          )}

          {activeTab === 'summary' && (
            <div className='space-y-4'>
              {weekSummaries.length === 0 ? (
                <div className='text-center py-8 text-gray-600'>
                  <p>No activity data available for this training block.</p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {weekSummaries.map(({ weekStart, weekNumber, summary }) => {
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                    const avgHeartRate =
                      summary.heartRateCount > 0 ? summary.heartRateSum / summary.heartRateCount : null;
                    const totalTimeHours = summary.totalTime / 3600;
                    const avgPace = calculateAveragePace(summary);

                    return (
                      <div key={weekNumber} className='bg-gray-50 rounded-lg p-6 border border-gray-200'>
                        <div className='flex items-center justify-between mb-4'>
                          <div>
                            <h4 className='text-lg font-semibold text-gray-900'>Week {weekNumber}</h4>
                            <p className='text-sm text-gray-600'>{weekLabel}</p>
                          </div>
                        </div>

                        <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                          <div>
                            <p className='text-sm text-gray-600'>Runs</p>
                            <p className='text-2xl font-bold text-gray-900'>{summary.totalRuns}</p>
                          </div>
                          <div>
                            <p className='text-sm text-gray-600'>Miles</p>
                            <p className='text-2xl font-bold text-gray-900'>{summary.totalMiles.toFixed(2)}</p>
                          </div>
                          {summary.totalTime > 0 && (
                            <div>
                              <p className='text-sm text-gray-600'>Time</p>
                              <p className='text-2xl font-bold text-gray-900'>{formatTimeFromHours(totalTimeHours)}</p>
                            </div>
                          )}
                          {avgPace !== null && (
                            <div>
                              <p className='text-sm text-gray-600'>Avg Pace</p>
                              <p className='text-2xl font-bold text-gray-900'>{avgPace} /mi</p>
                            </div>
                          )}
                          {summary.totalCalories > 0 && (
                            <div>
                              <p className='text-sm text-gray-600'>Calories</p>
                              <p className='text-2xl font-bold text-gray-900'>
                                {Math.round(summary.totalCalories).toLocaleString()}
                              </p>
                            </div>
                          )}
                          {avgHeartRate !== null && (
                            <div>
                              <p className='text-sm text-gray-600'>Avg Heart Rate</p>
                              <p className='text-2xl font-bold text-gray-900'>{Math.round(avgHeartRate)} bpm</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

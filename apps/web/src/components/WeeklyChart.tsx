import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from '../types/activity';

interface WeeklyChartProps {
  activities: Activity[];
}

interface DayData {
  day: string;
  dayLabel: string;
  date: Date;
  miles: number;
  time: number; // in seconds
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

interface WeekSummary {
  totalMiles: number;
  totalCalories: number;
  totalTime: number; // in seconds
  heartRateSum: number;
  heartRateCount: number;
  paceActivities: number; // count of activities with both distance and time for pace calculation
}

// Get data for a specific week
function getWeekData(activities: Activity[], weekStart: Date): { days: DayData[]; summary: WeekSummary } {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Initialize all 7 days
  const days: DayData[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    days.push({
      day: dayNames[i],
      dayLabel: `${dayNames[i]} ${date.getDate()}`,
      date: new Date(date),
      miles: 0,
      time: 0,
    });
  }

  // Initialize summary
  const summary: WeekSummary = {
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

export function WeeklyChart({ activities }: WeeklyChartProps) {
  const availableWeeks = useMemo(() => getAvailableWeeks(activities), [activities]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  if (availableWeeks.length === 0) {
    return (
      <div className='bg-white rounded-lg shadow-md p-8 text-center'>
        <p className='text-gray-600 text-lg'>No activity data available for weekly chart.</p>
      </div>
    );
  }

  const currentWeekStart = availableWeeks[currentWeekIndex];
  const { days: weekData, summary } = useMemo(
    () => getWeekData(activities, currentWeekStart),
    [activities, currentWeekStart]
  );

  const weekLabel = `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(
    currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000
  ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

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

  // Calculate derived metrics
  const totalMiles = summary.totalMiles;
  const totalRuns = weekData.filter((d) => d.miles > 0).length;
  const avgMilesPerDay = totalRuns > 0 ? totalMiles / 7 : 0;
  const avgHeartRate = summary.heartRateCount > 0 ? summary.heartRateSum / summary.heartRateCount : null;
  const totalTimeHours = summary.totalTime / 3600;

  // Calculate average pace (minutes:seconds per mile)
  const calculateAveragePace = (): string | null => {
    if (summary.totalMiles === 0 || summary.totalTime === 0) return null;
    const secondsPerMile = summary.totalTime / summary.totalMiles;
    const minutes = Math.floor(secondsPerMile / 60);
    const seconds = Math.floor(secondsPerMile % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const averagePace = calculateAveragePace();

  // Format time
  const formatTime = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m`;
  };

  return (
    <div className='space-y-6'>
      {/* Week Navigation */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h2 className='text-2xl font-bold text-gray-900'>Weekly Training Progress</h2>
            <p className='text-gray-600 mt-1'>{weekLabel}</p>
          </div>
          <div className='flex items-center gap-4'>
            <button
              onClick={goToPreviousWeek}
              disabled={currentWeekIndex >= availableWeeks.length - 1}
              className='px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={2}
                stroke='currentColor'
                className='w-5 h-5'
              >
                <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 19.5L8.25 12l7.5-7.5' />
              </svg>
              Previous
            </button>
            <span className='text-sm text-gray-500'>
              Week {availableWeeks.length - currentWeekIndex} of {availableWeeks.length}
            </span>
            <button
              onClick={goToNextWeek}
              disabled={currentWeekIndex === 0}
              className='px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2'
            >
              Next
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={2}
                stroke='currentColor'
                className='w-5 h-5'
              >
                <path strokeLinecap='round' strokeLinejoin='round' d='M8.25 4.5l7.5 7.5-7.5 7.5' />
              </svg>
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
                <p className='text-2xl font-bold text-gray-900'>{formatTime(totalTimeHours)}</p>
              </div>
            )}
            {averagePace !== null && (
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='text-sm text-gray-600'>Avg Pace</p>
                <p className='text-2xl font-bold text-gray-900'>{averagePace} /mi</p>
              </div>
            )}
          </div>

          {/* Second row: Total Calories, Avg Heart Rate, Avg Miles per Day */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {avgHeartRate !== null && (
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='text-sm text-gray-600'>Avg Heart Rate</p>
                <p className='text-2xl font-bold text-gray-900'>{Math.round(avgHeartRate)} bpm</p>
              </div>
            )}
            {summary.totalCalories > 0 && (
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='text-sm text-gray-600'>Total Calories</p>
                <p className='text-2xl font-bold text-gray-900'>{Math.round(summary.totalCalories).toLocaleString()}</p>
              </div>
            )}
            <div className='bg-gray-50 rounded-lg p-4'>
              <p className='text-sm text-gray-600'>Avg Miles per Day</p>
              <p className='text-2xl font-bold text-gray-900'>{avgMilesPerDay.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <ResponsiveContainer width='100%' height={400}>
          <BarChart data={weekData}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='dayLabel' />
            <YAxis label={{ value: 'Miles', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;

                const data = payload[0].payload as DayData;
                const miles = data.miles;
                const timeSeconds = data.time;

                // Format time
                const formatTime = (seconds: number): string => {
                  if (seconds === 0) return '0m';
                  const h = Math.floor(seconds / 3600);
                  const m = Math.floor((seconds % 3600) / 60);
                  if (h > 0) {
                    return `${h}h ${m}m`;
                  }
                  return `${m}m`;
                };

                // Calculate pace (minutes:seconds per mile)
                const calculatePace = (): string | null => {
                  if (miles === 0 || timeSeconds === 0) return null;
                  const secondsPerMile = timeSeconds / miles;
                  const minutes = Math.floor(secondsPerMile / 60);
                  const seconds = Math.floor(secondsPerMile % 60);
                  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                };

                const pace = calculatePace();
                const timeFormatted = formatTime(timeSeconds);

                return (
                  <div className='bg-white border border-gray-200 rounded-lg shadow-lg p-3'>
                    <p className='font-semibold text-gray-900 mb-2'>{label}</p>
                    <div className='space-y-1 text-sm'>
                      <div className='text-gray-700'>
                        Miles: <span className='font-medium'>{miles.toFixed(2)}</span>
                      </div>
                      {pace && (
                        <div className='text-gray-700'>
                          Pace: <span className='font-medium'>{pace}</span>
                        </div>
                      )}
                      {timeSeconds > 0 && (
                        <div className='text-gray-700'>
                          Time: <span className='font-medium'>{timeFormatted}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey='miles' fill='#3b82f6' radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from '../types/activity';
import { TrainingBlock } from '../api/training-blocks';
import { formatTimeFromHours, formatTimeFromSecondsSimple } from '../util/time';
import { ArrowIcon } from './ArrowIcon';

interface WeeklyChartProps {
  activities: Activity[];
  trainingBlocks: TrainingBlock[];
}

interface DayData {
  day: string;
  dayLabel: string;
  date: Date;
  miles: number;
  time: number;
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
  totalRuns: number;
  totalMiles: number;
  totalCalories: number;
  totalTime: number;
  heartRateSum: number;
  heartRateCount: number;
  paceActivities: number;
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

// Get all weeks for a training block
function getTrainingBlockWeeks(trainingBlock: TrainingBlock): Date[] {
  const weeks: Date[] = [];
  const startDate = new Date(trainingBlock.startDate);
  startDate.setHours(0, 0, 0, 0);

  // First week starts on the Monday on or after the training block start date
  // If start date is Monday, use it. Otherwise, find the next Monday.
  const startDayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  let firstWeekStart: Date;
  if (startDayOfWeek === 1) {
    // Start date is already Monday, use it
    firstWeekStart = new Date(startDate);
  } else if (startDayOfWeek === 0) {
    // Start date is Sunday, next Monday is 1 day away
    firstWeekStart = new Date(startDate);
    firstWeekStart.setDate(startDate.getDate() + 1);
  } else {
    // Start date is Tuesday-Saturday, find the next Monday
    const daysUntilNextMonday = 8 - startDayOfWeek;
    firstWeekStart = new Date(startDate);
    firstWeekStart.setDate(startDate.getDate() + daysUntilNextMonday);
  }
  firstWeekStart.setHours(0, 0, 0, 0);
  weeks.push(firstWeekStart);

  // If duration is only 1 week, we're done
  if (trainingBlock.durationWeeks === 1) {
    return weeks;
  }

  // Week 1 is 7 days starting from firstWeekStart (Monday), so it ends on firstWeekStart + 6 days
  // Week 2 should start on the Monday after Week 1 ends
  const week1End = new Date(firstWeekStart);
  week1End.setDate(firstWeekStart.getDate() + 6); // Week 1 ends 6 days after start (7 days total)
  week1End.setHours(23, 59, 59, 999);

  // Find the Monday after Week 1 ends
  const week1EndDayOfWeek = week1End.getDay(); // 0 = Sunday, 1 = Monday, etc.
  let daysUntilNextMonday;
  if (week1EndDayOfWeek === 0) {
    // Week 1 ends on Sunday -> next Monday is 1 day away
    daysUntilNextMonday = 1;
  } else if (week1EndDayOfWeek === 1) {
    // Week 1 ends on Monday -> next Monday is 7 days away
    daysUntilNextMonday = 7;
  } else {
    // Week 1 ends Tuesday-Saturday -> next Monday is 8 - dayOfWeek days away
    daysUntilNextMonday = 8 - week1EndDayOfWeek;
  }

  const secondWeekStart = new Date(week1End);
  secondWeekStart.setDate(week1End.getDate() + daysUntilNextMonday);
  secondWeekStart.setHours(0, 0, 0, 0);

  // Subsequent weeks start on Monday, 7 days apart
  // We already have week 1, so we need durationWeeks - 1 more weeks
  for (let i = 0; i < trainingBlock.durationWeeks - 1; i++) {
    const weekStart = new Date(secondWeekStart);
    weekStart.setDate(secondWeekStart.getDate() + i * 7);
    // Ensure we don't add duplicate weeks
    const weekStartTime = weekStart.getTime();
    if (!weeks.some((w) => w.getTime() === weekStartTime)) {
      weeks.push(weekStart);
    }
  }

  return weeks;
}

// Get all week summaries for a training block
function getAllWeekSummaries(
  activities: Activity[],
  trainingBlock: TrainingBlock
): Array<{ weekStart: Date; weekNumber: number; summary: WeekSummary }> {
  const weeks = getTrainingBlockWeeks(trainingBlock);
  return weeks.map((weekStart, index) => {
    const { summary } = getWeekData(activities, weekStart);
    return {
      weekStart,
      weekNumber: index + 1,
      summary,
    };
  });
}

export function WeeklyChart({ activities, trainingBlocks }: WeeklyChartProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'summary'>('daily');
  const [selectedTrainingBlockId, setSelectedTrainingBlockId] = useState<string | null>(null);

  const availableWeeks = useMemo(() => getAvailableWeeks(activities), [activities]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  // Get selected training block or use the most recent one
  const selectedTrainingBlock = useMemo(() => {
    if (selectedTrainingBlockId) {
      return trainingBlocks.find((tb) => tb.id === selectedTrainingBlockId) || null;
    }
    // Default to most recent training block (by race date)
    return trainingBlocks.length > 0 ? trainingBlocks[trainingBlocks.length - 1] : null;
  }, [trainingBlocks, selectedTrainingBlockId]);

  // Get all week summaries for the selected training block
  const weekSummaries = useMemo(() => {
    if (!selectedTrainingBlock) return [];
    return getAllWeekSummaries(activities, selectedTrainingBlock);
  }, [activities, selectedTrainingBlock]);

  // Calculate average pace helper
  const calculateAveragePace = (summary: WeekSummary): string | null => {
    if (summary.totalMiles === 0 || summary.totalTime === 0) return null;
    const secondsPerMile = summary.totalTime / summary.totalMiles;
    const minutes = Math.floor(secondsPerMile / 60);
    const seconds = Math.floor(secondsPerMile % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (availableWeeks.length === 0 && activeTab === 'daily') {
    return (
      <div className='bg-white rounded-lg shadow-md p-8 text-center'>
        <p className='text-gray-600 text-lg'>No activity data available for weekly breakdown.</p>
      </div>
    );
  }

  if (activeTab === 'summary' && trainingBlocks.length === 0) {
    return (
      <div className='bg-white rounded-lg shadow-md p-8 text-center'>
        <p className='text-gray-600 text-lg'>
          No training blocks available. Create a training block to view weekly summaries.
        </p>
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

  // Calculate derived metrics for daily view
  const totalMiles = summary.totalMiles;
  const totalRuns = weekData.filter((d) => d.miles > 0).length;
  const avgMilesPerDay = totalRuns > 0 ? totalMiles / 7 : 0;
  const avgHeartRate = summary.heartRateCount > 0 ? summary.heartRateSum / summary.heartRateCount : null;
  const totalTimeHours = summary.totalTime / 3600;
  const averagePace = calculateAveragePace(summary);

  return (
    <div className='space-y-6'>
      {/* Tabs */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
        <div className='flex border-b border-gray-200 mb-6'>
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'daily' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Daily View
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'summary' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Weekly Summary
          </button>
        </div>

        {activeTab === 'summary' && (
          <div className='mb-6'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Training Block</label>
            <select
              value={selectedTrainingBlockId || ''}
              onChange={(e) => setSelectedTrainingBlockId(e.target.value || null)}
              className='w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              {trainingBlocks.length === 0 ? (
                <option value=''>No training blocks available</option>
              ) : (
                trainingBlocks.map((tb) => (
                  <option key={tb.id} value={tb.id}>
                    {tb.raceName} ({new Date(tb.startDate).toLocaleDateString()} -{' '}
                    {new Date(tb.raceDate).toLocaleDateString()})
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        {activeTab === 'daily' && (
          <>
            {/* Week Navigation */}
            <div className='flex items-center justify-between mb-6'>
              <div>
                <h2 className='text-2xl font-bold text-gray-900'>Weekly Training Progress</h2>
                <p className='text-gray-600 mt-1'>{weekLabel}</p>
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

                    // Calculate pace (minutes:seconds per mile)
                    const calculatePace = (): string | null => {
                      if (miles === 0 || timeSeconds === 0) return null;
                      const secondsPerMile = timeSeconds / miles;
                      const minutes = Math.floor(secondsPerMile / 60);
                      const seconds = Math.floor(secondsPerMile % 60);
                      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    };

                    const pace = calculatePace();
                    const timeFormatted = formatTimeFromSecondsSimple(timeSeconds);

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
          </>
        )}

        {activeTab === 'summary' && (
          <div className='space-y-4'>
            {!selectedTrainingBlock ? (
              <div className='text-center py-8 text-gray-600'>
                <p>Please select a training block to view weekly summaries.</p>
              </div>
            ) : (
              <>
                <div className='mb-4'>
                  <h3 className='text-xl font-bold text-gray-900'>{selectedTrainingBlock.raceName}</h3>
                  <p className='text-gray-600 text-sm'>
                    {new Date(selectedTrainingBlock.startDate).toLocaleDateString()} -{' '}
                    {new Date(selectedTrainingBlock.raceDate).toLocaleDateString()}
                  </p>
                </div>

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
                                <p className='text-2xl font-bold text-gray-900'>
                                  {formatTimeFromHours(totalTimeHours)}
                                </p>
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

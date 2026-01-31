import { useState } from 'react';
import { calculateAveragePaceFromSummary, formatTimeFromHours } from '../util/time';
import { useActivities } from '../contexts/ActivitiesContext';
import { ArrowIcon } from '../components/ArrowIcon';
import WeeklyChart from '../components/WeeklyChart';

export function Weekly() {
  const {
    isLoading: isActivitiesLoading,
    isError: isActivitiesError,
    availableWeeks,
    getWeekData,
    weekSummaries,
  } = useActivities();

  const [activeTab, setActiveTab] = useState<'weekly' | 'summary'>('weekly');
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  const currentWeekStart = availableWeeks[currentWeekIndex] ?? null;
  const { days: weekData, summary } = currentWeekStart
    ? getWeekData(currentWeekStart)
    : { days: [], summary: null };

  const weekLabel = currentWeekStart
    ? `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(
        currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : '';

  const goToPreviousWeek = () => {
    if (currentWeekIndex < availableWeeks.length - 1) setCurrentWeekIndex(currentWeekIndex + 1);
  };

  const goToNextWeek = () => {
    if (currentWeekIndex > 0) setCurrentWeekIndex(currentWeekIndex - 1);
  };

  const totalMiles = summary?.totalMiles ?? 0;
  const totalRuns = weekData.filter((d) => d.miles > 0).length;
  const avgMilesPerDay = totalRuns > 0 ? totalMiles / 7 : 0;
  const avgHeartRate =
    summary && summary.heartRateCount > 0 ? summary.heartRateSum / summary.heartRateCount : null;
  const totalTimeHours = (summary?.totalTime ?? 0) / 3600;
  const averagePace = summary ? calculateAveragePaceFromSummary(summary) : null;

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
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 '>
          <div className='flex border-b border-gray-200 mb-4'>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'weekly'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Weekly View
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'summary'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Summary
            </button>
          </div>

          {activeTab === 'weekly' && (
            <>
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <p className='text-gray-600'>{weekLabel}</p>
                </div>
                <div className='flex items-center gap-4'>
                  <button
                    onClick={goToPreviousWeek}
                    disabled={currentWeekIndex >= availableWeeks.length - 1}
                    className='px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg font-medium transition-colors flex items-center gap-2'
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
                    className='px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg font-medium transition-colors flex items-center gap-2'
                  >
                    Next
                    <ArrowIcon direction='right' />
                  </button>
                </div>
              </div>

              {/* Summary Stats */}
              <div className='space-y-4 mb-6'>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                  <div className='bg-gray-50 rounded-lg p-4'>
                    <p className='text-sm text-gray-600'>Runs</p>
                    <p className='text-2xl font-bold text-gray-900'>{totalRuns}</p>
                  </div>
                  <div className='bg-gray-50 rounded-lg p-4'>
                    <p className='text-sm text-gray-600'>Miles</p>
                    <p className='text-2xl font-bold text-gray-900'>{totalMiles.toFixed(2)}</p>
                  </div>
                  {summary && summary.totalTime > 0 && (
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

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  {avgHeartRate !== null && (
                    <div className='bg-gray-50 rounded-lg p-4'>
                      <p className='text-sm text-gray-600'>Avg Heart Rate</p>
                      <p className='text-2xl font-bold text-gray-900'>{Math.round(avgHeartRate)} bpm</p>
                    </div>
                  )}
                  {summary && summary.totalCalories > 0 && (
                    <div className='bg-gray-50 rounded-lg p-4'>
                      <p className='text-sm text-gray-600'>Calories</p>
                      <p className='text-2xl font-bold text-gray-900'>
                        {Math.round(summary.totalCalories)}
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
                    const avgPace = calculateAveragePaceFromSummary(summary);

                    return (
                      <div key={weekNumber} className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                        <div className='flex items-center justify-between mb-2'>
                          <div>
                            <h4 className='font-semibold text-gray-900'>Week {weekNumber}</h4>
                            <p className='text-sm text-gray-600'>{weekLabel}</p>
                          </div>
                        </div>

                        <div className='grid sm:grid-cols-2 md:grid-cols-6 gap-1'>
                          <div>
                            <p className='text-sm text-gray-600'>Runs</p>
                            <p className='font-bold text-gray-900'>{summary.totalRuns}</p>
                          </div>
                          <div>
                            <p className='text-sm text-gray-600'>Miles</p>
                            <p className='font-bold text-gray-900'>{summary.totalMiles.toFixed(2)}</p>
                          </div>
                          {summary.totalTime > 0 && (
                            <div>
                              <p className='text-sm text-gray-600'>Time</p>
                              <p className='font-bold text-gray-900'>{formatTimeFromHours(totalTimeHours)}</p>
                            </div>
                          )}
                          {avgPace !== null && (
                            <div>
                              <p className='text-sm text-gray-600'>Avg Pace</p>
                              <p className='font-bold text-gray-900'>{avgPace} /mi</p>
                            </div>
                          )}
                          {summary.totalCalories > 0 && (
                            <div>
                              <p className='text-sm text-gray-600'>Calories</p>
                              <p className='font-bold text-gray-900'>
                                {Math.round(summary.totalCalories).toLocaleString()}
                              </p>
                            </div>
                          )}
                          {avgHeartRate !== null && (
                            <div>
                              <p className='text-sm text-gray-600'>Avg Heart Rate</p>
                              <p className='font-bold text-gray-900'>{Math.round(avgHeartRate)} bpm</p>
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

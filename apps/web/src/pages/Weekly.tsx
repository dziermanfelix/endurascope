import { useState, useMemo, useEffect } from 'react';
import { calculateAveragePaceFromSummary, formatTimeFromHours, isSameDay } from '../util/time';
import { getWeekStart, getWeekDataForStart, DayData } from '../util/week';
import { useActivities } from '../contexts/ActivitiesContext';
import { useSelectedTrainingBlock } from '../contexts/SelectedTrainingBlockContext';
import { filterActivitiesByBlock } from '../util/trainingBlock';
import { TrainingBlockSelector } from '../components/TrainingBlockSelector';
import { ArrowIcon } from '../icons/ArrowIcon';
import WeeklyChart from '../components/WeeklyChart';
import { Activity } from '../types/activity';
import { ActivityModal } from '../components/ActivityModal';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function Weekly() {
  const {
    activities,
    isLoading: isActivitiesLoading,
    isError: isActivitiesError,
    availableWeeks,
    getWeekData,
  } = useActivities();
  const { selectedTrainingBlock } = useSelectedTrainingBlock();

  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const currentCalendarWeekStart = useMemo(() => getWeekStart(new Date()), []);

  const filteredActivities = useMemo(
    () => filterActivitiesByBlock(activities, selectedTrainingBlock),
    [activities, selectedTrainingBlock],
  );

  const displayedWeeks = useMemo(() => {
    if (!selectedTrainingBlock) {
      const hasCurrent = availableWeeks.some((w) => isSameDay(w, currentCalendarWeekStart));
      if (!hasCurrent) {
        const weeks = [...availableWeeks, new Date(currentCalendarWeekStart.getTime())];
        return weeks.sort((a, b) => b.getTime() - a.getTime());
      }
      return availableWeeks;
    }
    const startDate = new Date(selectedTrainingBlock.startDate);
    const startLocal = new Date(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
    const blockStartWeek = getWeekStart(startLocal);
    const weeks: Date[] = [];
    for (let i = 0; i < selectedTrainingBlock.durationWeeks; i++) {
      const weekStart = new Date(blockStartWeek);
      weekStart.setDate(weekStart.getDate() + i * 7);
      weeks.push(weekStart);
    }
    return weeks.sort((a, b) => b.getTime() - a.getTime());
  }, [selectedTrainingBlock, availableWeeks, currentCalendarWeekStart]);

  const getDisplayedWeekData = (weekStart: Date) =>
    selectedTrainingBlock ? getWeekDataForStart(filteredActivities, weekStart) : getWeekData(weekStart);

  useEffect(() => {
    let idx = displayedWeeks.findIndex((w) => isSameDay(w, currentCalendarWeekStart));
    if (idx < 0) {
      const currentTime = currentCalendarWeekStart.getTime();
      let minDiff = Infinity;
      displayedWeeks.forEach((w, i) => {
        const diff = Math.abs(w.getTime() - currentTime);
        if (diff < minDiff) {
          minDiff = diff;
          idx = i;
        }
      });
      if (idx < 0) idx = 0;
    }
    setCurrentWeekIndex(idx);
  }, [displayedWeeks, currentCalendarWeekStart]);

  const currentWeekStart = displayedWeeks[currentWeekIndex] ?? null;
  const { days: weekData, summary } = currentWeekStart
    ? getDisplayedWeekData(currentWeekStart)
    : { days: [], summary: null };

  const weekLabel = currentWeekStart
    ? `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(currentWeekStart.getTime() + 6 * MS_PER_DAY).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : '';

  const goToPreviousWeek = () => {
    if (currentWeekIndex < displayedWeeks.length - 1) setCurrentWeekIndex(currentWeekIndex + 1);
  };

  const goToNextWeek = () => {
    if (currentWeekIndex > 0) setCurrentWeekIndex(currentWeekIndex - 1);
  };

  const totalMiles = summary?.totalMiles ?? 0;
  const totalRuns = weekData.filter((d) => d.miles > 0).length;
  const avgMilesPerDay = totalRuns > 0 ? totalMiles / 7 : 0;
  const avgHeartRate = summary && summary.heartRateCount > 0 ? summary.heartRateSum / summary.heartRateCount : null;
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

  return (
    <>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold text-gray-900'>Weekly Training</h2>
        <TrainingBlockSelector />
      </div>
      <div className='space-y-6'>
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex flex-col border-b border-gray-200 mb-4'>
            <div className='flex items-center justify-between mb-6'>
              <p className='text-gray-600'>{weekLabel}</p>
              <div className='flex items-center gap-4'>
                <button
                  onClick={goToPreviousWeek}
                  disabled={currentWeekIndex >= displayedWeeks.length - 1}
                  className='px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg font-medium transition-colors flex items-center gap-2'
                >
                  <ArrowIcon direction='left' />
                  Previous
                </button>
                <span className='text-sm text-gray-500'>
                  Week {displayedWeeks.length - currentWeekIndex} of {displayedWeeks.length}
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

            <div className='mb-6 flex flex-wrap items-baseline justify-center gap-x-6 gap-y-1 text-gray-700'>
              <span>
                <span className='text-gray-500'>Runs</span>{' '}
                <span className='font-semibold tabular-nums text-gray-900'>{totalRuns}</span>
              </span>
              <span>
                <span className='text-gray-500'>Miles</span>{' '}
                <span className='font-semibold tabular-nums text-gray-900'>{totalMiles.toFixed(2)}</span>
              </span>
              {(summary?.totalTime ?? 0) > 0 && (
                <span>
                  <span className='text-gray-500'>Time</span>{' '}
                  <span className='font-semibold tabular-nums text-gray-900'>
                    {formatTimeFromHours(totalTimeHours)}
                  </span>
                </span>
              )}
              {averagePace !== null && (
                <span>
                  <span className='text-gray-500'>Avg pace</span>{' '}
                  <span className='font-semibold tabular-nums text-gray-900'>{averagePace}/mi</span>
                </span>
              )}
              {avgHeartRate !== null && (
                <span>
                  <span className='text-gray-500'>Avg HR</span>{' '}
                  <span className='font-semibold tabular-nums text-gray-900'>{Math.round(avgHeartRate)} bpm</span>
                </span>
              )}
              {summary && summary.totalCalories > 0 && (
                <span>
                  <span className='text-gray-500'>Calories</span>{' '}
                  <span className='font-semibold tabular-nums text-gray-900'>
                    {Math.round(summary.totalCalories).toLocaleString()}
                  </span>
                </span>
              )}
              <span>
                <span className='text-gray-500'>Miles/day</span>{' '}
                <span className='font-semibold tabular-nums text-gray-900'>{avgMilesPerDay.toFixed(2)}</span>
              </span>
            </div>

            <WeeklyChart weekData={weekData} onClick={(day: DayData) => setSelectedActivity(day.activity ?? null)} />
          </div>
        </div>
      </div>
      {selectedActivity && <ActivityModal activity={selectedActivity} onClose={() => setSelectedActivity(null)} />}
    </>
  );
}

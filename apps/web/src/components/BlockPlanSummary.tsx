import type { PlanWeekSummary } from '../api/plan';
import {
  averageHeartRateFromSummary,
  averagePaceFromSummary,
  elapsedTimeFromSummary,
  formatElevationFeet,
} from '../util/planFormat';
import { averagePerWeek, formatRunsDiff, plannedVsActualMilesDiff, plannedVsActualRunsDiff } from '../util/planSummary';

interface BlockPlanSummaryProps {
  summary: PlanWeekSummary;
  weekCount: number;
}

const th = 'px-2 py-2 text-xs font-medium text-gray-500 border-b border-gray-200 whitespace-nowrap';
const td = 'px-2 py-1.5 text-xs text-gray-900 align-middle';
const tdR = `${td} text-right tabular-nums`;
const sum = 'border-t-2 border-gray-300';

function diffClass(diff: number | null | undefined) {
  if (diff == null || diff === 0) return '';
  return diff < 0 ? 'text-red-600' : 'text-green-600';
}

export function BlockPlanSummary({ summary, weekCount }: BlockPlanSummaryProps) {
  const avgPlannedMilesPerWeek = averagePerWeek(summary.plannedMiles, weekCount);
  const avgActualMilesPerWeek = averagePerWeek(summary.actualMiles, weekCount);
  const avgActualRunsPerWeek = averagePerWeek(summary.actualRuns ?? 0, weekCount);
  const diffMiles = plannedVsActualMilesDiff(summary);
  const diffRuns = plannedVsActualRunsDiff(summary);

  return (
    <section>
      <h3 className='mb-2 font-semibold text-gray-900'>Block Summary</h3>
      <div className='overflow-x-auto rounded-lg border border-gray-300 bg-white shadow-sm'>
        <table className='w-full min-w-[900px] border-collapse text-sm'>
          <thead className='bg-gray-50'>
            <tr>
              <th className={`${th} text-left`}>Date</th>
              <th className={`${th} text-center`}>Day</th>
              <th className={`${th} text-right`}>Plan</th>
              <th className={`${th} text-left`}>Type</th>
              <th className={`${th} text-left`}>Activity</th>
              <th className={`${th} text-right border-l border-gray-200`}>Miles</th>
              <th className={`${th} text-right`}>Pace</th>
              <th className={`${th} text-right`}>Time</th>
              <th className={`${th} text-right`}>Avg HR</th>
              <th className={`${th} text-right`}>Cal</th>
              <th className={`${th} text-right`}>Asc</th>
              <th className={`${th} text-right`}>Diff</th>
            </tr>
          </thead>
          <tbody>
            <tr className='bg-orange-50 font-medium'>
              <td colSpan={2} className={`${td} ${sum}`}>
                {weekCount} {weekCount === 1 ? 'week' : 'weeks'}
              </td>
              <td className={`${tdR} ${sum}`}>
                <div>{summary.plannedMiles.toFixed(2)}</div>
                <div className='font-normal text-gray-500'>{avgPlannedMilesPerWeek.toFixed(2)} avg/wk</div>
              </td>
              <td colSpan={2} className={`${td} ${sum} text-gray-600`}>
                {summary.plannedRuns} planned runs
              </td>
              <td className={`${tdR} border-l border-gray-200 ${sum}`}>
                <div>{summary.actualMiles.toFixed(2)}</div>
                <div className='font-normal text-gray-500'>
                  {summary.actualRuns ?? 0} {(summary.actualRuns ?? 0) === 1 ? 'run' : 'runs'}
                  {weekCount > 0 ? ` · ${avgActualRunsPerWeek.toFixed(1)} avg/wk` : ''}
                </div>
                <div className='font-normal text-gray-500'>{avgActualMilesPerWeek.toFixed(2)} mi avg/wk</div>
              </td>
              <td className={`${tdR} ${sum}`}>{averagePaceFromSummary(summary)}</td>
              <td className={`${tdR} ${sum}`}>{elapsedTimeFromSummary(summary)}</td>
              <td className={`${tdR} ${sum}`}>{averageHeartRateFromSummary(summary)}</td>
              <td className={`${tdR} ${sum}`}>{summary.totalCalories || ''}</td>
              <td className={`${tdR} ${sum}`}>
                {summary.totalElevationGain ? formatElevationFeet(summary.totalElevationGain) : ''}
              </td>
              <td className={`${tdR} ${sum}`}>
                <div className={diffClass(diffMiles)}>{diffMiles.toFixed(2)} mi</div>
                <div className={`font-normal ${diffClass(diffRuns)}`}>{formatRunsDiff(diffRuns)}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

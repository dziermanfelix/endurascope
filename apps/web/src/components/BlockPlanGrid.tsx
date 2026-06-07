import { useState } from 'react';
import type { TrainingBlockPlan, UpdatePlannedWorkoutDto } from '../api/plan';
import { updatePlannedWorkout } from '../api/plan';
import { formatWorkoutTypeLabel, PLANNED_WORKOUT_TYPES, type PlannedWorkoutType } from '../util/planWorkoutType';
import {
  averageHeartRateFromSummary,
  averagePaceFromSummary,
  elapsedTimeFromSeconds,
  elapsedTimeFromSummary,
  formatElevationFeet,
  formatPlanDate,
  paceFromAverageSpeed,
} from '../util/planFormat';
import { blurOnEnter } from '../util/form';

interface BlockPlanGridProps {
  week: TrainingBlockPlan['weeks'][number];
  blockId: string;
  locked: boolean;
  onPlanUpdated: (plan: TrainingBlockPlan) => void;
  onActivityClick?: (activityId: string) => void;
}

const th = 'px-2 py-2 text-xs font-medium text-gray-500 border-b border-gray-200 whitespace-nowrap';
const td = 'px-2 py-1.5 text-xs text-gray-900 border-b border-gray-100 align-middle';
const tdR = `${td} text-right tabular-nums`;
const input =
  'w-full rounded border border-gray-200 px-1.5 py-1 text-xs focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400';
const sum = 'border-t-2 border-gray-200';

function diffClass(diff: number | null | undefined) {
  if (diff == null || diff === 0) return '';
  return diff < 0 ? 'text-red-600' : 'text-green-600';
}

export function BlockPlanGrid({ week, blockId, locked, onPlanUpdated, onActivityClick }: BlockPlanGridProps) {
  const [saving, setSaving] = useState<string | null>(null);

  async function saveWorkout(rowId: string, data: UpdatePlannedWorkoutDto) {
    setSaving(rowId);
    try {
      onPlanUpdated(await updatePlannedWorkout(blockId, rowId, data));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className='overflow-x-auto rounded-lg border border-gray-200 bg-white'>
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
          {week.rows.map((row) => {
            const extra = row.id.startsWith('activity:');
            const { actual } = row;
            const busy = saving === row.id;

            return (
              <tr key={row.id} className={busy ? 'opacity-60' : undefined}>
                <td className={`${td} text-gray-600 whitespace-nowrap`}>{formatPlanDate(row.scheduledDate)}</td>
                <td className={`${td} text-center font-medium`}>{row.dayCode}</td>
                <td className={tdR}>
                  {extra || locked ? (
                    extra ? (
                      '—'
                    ) : (
                      (row.plannedMiles ?? '')
                    )
                  ) : (
                    <input
                      type='text'
                      inputMode='decimal'
                      defaultValue={row.plannedMiles ?? ''}
                      disabled={busy}
                      onKeyDown={blurOnEnter}
                      onBlur={(e) => {
                        const v = e.target.value === '' ? null : parseFloat(e.target.value);
                        if (v !== row.plannedMiles) void saveWorkout(row.id, { plannedMiles: v });
                      }}
                      className={`${input} max-w-16 ml-auto text-right tabular-nums`}
                    />
                  )}
                </td>
                <td className={td}>
                  {extra || locked ? (
                    extra ? (
                      '—'
                    ) : row.workoutType ? (
                      formatWorkoutTypeLabel(row.workoutType)
                    ) : (
                      ''
                    )
                  ) : (
                    <select
                      defaultValue={row.workoutType ?? ''}
                      disabled={busy}
                      onChange={(e) => {
                        const v = (e.target.value || null) as PlannedWorkoutType | null;
                        if (v !== row.workoutType) void saveWorkout(row.id, { workoutType: v });
                      }}
                      className={input}
                    >
                      <option value=''>—</option>
                      {PLANNED_WORKOUT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {formatWorkoutTypeLabel(type)}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className={`${td} max-w-[200px] truncate`}>
                  {actual && (
                    <button
                      type='button'
                      onClick={() => onActivityClick?.(actual.id)}
                      className='truncate hover:text-orange-600 hover:underline'
                    >
                      {actual.name ?? 'Unnamed Activity'}
                    </button>
                  )}
                </td>
                <td className={`${tdR} border-l border-gray-200`}>{actual?.miles?.toFixed(2) ?? ''}</td>
                <td className={tdR}>{actual ? paceFromAverageSpeed(actual.averageSpeed) : ''}</td>
                <td className={tdR}>{elapsedTimeFromSeconds(actual?.elapsedTime)}</td>
                <td className={tdR}>{actual?.averageHeartRate ?? ''}</td>
                <td className={tdR}>{actual?.calories ?? ''}</td>
                <td className={tdR}>{formatElevationFeet(actual?.totalElevationGain ?? null)}</td>
                <td className={`${tdR} font-medium ${diffClass(row.diffMiles)}`}>
                  {row.diffMiles == null ? '' : row.diffMiles.toFixed(2)}
                </td>
              </tr>
            );
          })}
          <tr className='bg-gray-50 font-medium'>
            <td colSpan={2} className={`${td} ${sum}`}>
              Week {week.summary.weekNumber} total
            </td>
            <td className={`${tdR} ${sum}`}>{week.summary.plannedMiles.toFixed(2)}</td>
            <td colSpan={2} className={`${td} ${sum} text-gray-500`}>
              {week.summary.plannedRuns} planned runs
            </td>
            <td className={`${tdR} border-l border-gray-200 ${sum}`}>{week.summary.actualMiles.toFixed(2)}</td>
            <td className={`${tdR} ${sum}`}>{averagePaceFromSummary(week.summary)}</td>
            <td className={`${tdR} ${sum}`}>{elapsedTimeFromSummary(week.summary)}</td>
            <td className={`${tdR} ${sum}`}>{averageHeartRateFromSummary(week.summary)}</td>
            <td className={`${tdR} ${sum}`}>{week.summary.totalCalories || ''}</td>
            <td className={`${tdR} ${sum}`}>
              {week.summary.totalElevationGain ? formatElevationFeet(week.summary.totalElevationGain) : ''}
            </td>
            <td className={`${tdR} ${sum} ${diffClass(week.summary.diffMiles)}`}>
              {week.summary.diffMiles.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

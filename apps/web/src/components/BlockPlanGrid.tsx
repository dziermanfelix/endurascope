import { useCallback, useState } from 'react';
import type { PlanWorkoutRow, PlanWeekSummary, TrainingBlockPlan, UpdatePlannedWorkoutDto } from '../api/plan';
import { updatePlannedWorkout, updateTrainingWeek } from '../api/plan';
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
import { isActivityOnlyRow } from '../util/planWeeks';

interface BlockPlanGridProps {
  plan: TrainingBlockPlan;
  onPlanUpdated: (plan: TrainingBlockPlan) => void;
  onActivityClick?: (activityId: string) => void;
}

function formatDiff(diff: number | null): string {
  if (diff === null) return '';
  if (diff === 0) return '0.00';
  return diff > 0 ? diff.toFixed(2) : diff.toFixed(2);
}

const PLAN_TABLE_COLS_BEFORE_ACTIVITY = [52, 32, 56, 104] as const;
const PLAN_TABLE_COLS_AFTER_ACTIVITY = [52, 56, 68, 52, 48, 48, 56] as const;
const PLAN_TABLE_ACTIVITY_MIN_WIDTH = 180;

const PLAN_TABLE_MIN_WIDTH =
  [...PLAN_TABLE_COLS_BEFORE_ACTIVITY, ...PLAN_TABLE_COLS_AFTER_ACTIVITY].reduce((sum, width) => sum + width, 0) +
  PLAN_TABLE_ACTIVITY_MIN_WIDTH;

const PLAN_TABLE_COLGROUP = (
  <colgroup>
    {PLAN_TABLE_COLS_BEFORE_ACTIVITY.map((width, index) => (
      <col key={`before-${index}`} style={{ width }} />
    ))}
    <col />
    {PLAN_TABLE_COLS_AFTER_ACTIVITY.map((width, index) => (
      <col key={`after-${index}`} style={{ width }} />
    ))}
  </colgroup>
);

function PlanRow({
  row,
  blockId,
  onPlanUpdated,
  onActivityClick,
}: {
  row: PlanWorkoutRow;
  blockId: string;
  onPlanUpdated: (plan: TrainingBlockPlan) => void;
  onActivityClick?: (activityId: string) => void;
}) {
  const [saving, setSaving] = useState(false);

  const saveField = useCallback(
    async (data: UpdatePlannedWorkoutDto) => {
      setSaving(true);
      try {
        const updated = await updatePlannedWorkout(blockId, row.id, data);
        onPlanUpdated(updated);
      } finally {
        setSaving(false);
      }
    },
    [blockId, row.id, onPlanUpdated],
  );

  const actual = row.actual;
  const readOnly = isActivityOnlyRow(row);

  return (
    <tr className={`border-b border-gray-100 ${saving ? 'opacity-60' : ''}`}>
      <td className='px-2 py-1 text-xs text-gray-500 whitespace-nowrap'>{formatPlanDate(row.scheduledDate)}</td>
      <td className='px-2 py-1 text-xs font-medium text-gray-700'>{row.dayCode}</td>
      <td className='px-1 py-1 text-center'>
        {readOnly ? (
          <span className='text-xs text-gray-400'>—</span>
        ) : (
          <input
            type='number'
            step='0.01'
            min='0'
            defaultValue={row.plannedMiles ?? ''}
            onKeyDown={blurOnEnter}
            onBlur={(e) => {
              const v = e.target.value === '' ? null : parseFloat(e.target.value);
              if (v !== row.plannedMiles) saveField({ plannedMiles: v });
            }}
            className='w-14 mx-auto block text-xs border border-gray-200 rounded px-1 py-0.5 text-center'
          />
        )}
      </td>
      <td className='px-1 py-1'>
        {readOnly ? (
          <span className='text-xs text-gray-400'>—</span>
        ) : (
          <select
            defaultValue={row.workoutType ?? ''}
            onKeyDown={blurOnEnter}
            onChange={(e) => {
              const v = (e.target.value || null) as PlannedWorkoutType | null;
              if (v !== row.workoutType) saveField({ workoutType: v });
            }}
            className='w-full min-w-[88px] text-xs border border-gray-200 rounded px-1 py-0.5 bg-white'
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
      <td className='px-2 py-1 text-xs font-mono text-gray-800 overflow-hidden'>
        {actual ? (
          <button
            type='button'
            onClick={() => onActivityClick?.(actual.id)}
            title={actual.name ?? 'Unnamed Activity'}
            className='block w-full truncate text-left hover:text-orange-600 hover:underline cursor-pointer'
          >
            {actual.name ?? 'Unnamed Activity'}
          </button>
        ) : null}
      </td>
      <td className='px-2 py-1 text-xs text-center border-l border-gray-200'>
        {actual?.miles != null ? actual.miles.toFixed(2) : ''}
      </td>
      <td className='px-2 py-1 text-xs text-right'>{actual ? paceFromAverageSpeed(actual.averageSpeed) : ''}</td>
      <td className='px-2 py-1 text-xs text-right'>{elapsedTimeFromSeconds(actual?.elapsedTime)}</td>
      <td className='px-2 py-1 text-xs text-right'>{actual?.averageHeartRate ?? ''}</td>
      <td className='px-2 py-1 text-xs text-right'>{actual?.calories ?? ''}</td>
      <td className='px-2 py-1 text-xs text-right'>{formatElevationFeet(actual?.totalElevationGain ?? null)}</td>
      <td
        className={`px-2 py-1 text-xs text-right font-medium ${
          row.diffMiles !== null && row.diffMiles < 0
            ? 'text-red-600'
            : row.diffMiles !== null && row.diffMiles > 0
              ? 'text-green-600'
              : ''
        }`}
      >
        {formatDiff(row.diffMiles)}
      </td>
    </tr>
  );
}

function WeekSummaryRow({ summary }: { summary: PlanWeekSummary }) {
  return (
    <tr className='bg-gray-50 font-medium border-t-2 border-gray-300'>
      <td colSpan={2} className='px-2 py-2 text-xs text-gray-600'>
        Week {summary.weekNumber} total
      </td>
      <td className='px-2 py-2 text-xs text-center'>{summary.plannedMiles.toFixed(2)}</td>
      <td colSpan={2} className='px-2 py-2 text-xs text-gray-500'>
        {summary.plannedRuns} planned runs
      </td>
      <td className='px-2 py-2 text-xs text-center border-l border-gray-200'>{summary.actualMiles.toFixed(2)}</td>
      <td className='px-2 py-2 text-xs text-right'>{averagePaceFromSummary(summary)}</td>
      <td className='px-2 py-2 text-xs text-right'>{elapsedTimeFromSummary(summary)}</td>
      <td className='px-2 py-2 text-xs text-right'>{averageHeartRateFromSummary(summary)}</td>
      <td className='px-2 py-2 text-xs text-right'>{summary.totalCalories || ''}</td>
      <td className='px-2 py-2 text-xs text-right'>
        {summary.totalElevationGain ? formatElevationFeet(summary.totalElevationGain) : ''}
      </td>
      <td
        className={`px-2 py-2 text-xs text-right ${
          summary.diffMiles < 0 ? 'text-red-600' : summary.diffMiles > 0 ? 'text-green-600' : ''
        }`}
      >
        {formatDiff(summary.diffMiles)}
      </td>
    </tr>
  );
}

function WeekSectionHeader({
  weekNumber,
  story,
  blockId,
  onPlanUpdated,
}: {
  weekNumber: number;
  story: string | null;
  blockId: string;
  onPlanUpdated: (plan: TrainingBlockPlan) => void;
}) {
  const [saving, setSaving] = useState(false);

  return (
    <div className='flex flex-wrap items-center gap-3 mb-2 sticky top-0 bg-gray-50 py-2 z-10'>
      <h3 className='text-lg font-semibold text-gray-900'>Week {weekNumber}</h3>
      <label className='flex items-center gap-2 flex-1 min-w-[200px]'>
        <span className='text-xs font-medium text-gray-500 shrink-0'>Story</span>
        <input
          type='text'
          defaultValue={story ?? ''}
          disabled={saving}
          onKeyDown={blurOnEnter}
          onBlur={async (e) => {
            const v = e.target.value.trim() || null;
            if (v === (story ?? null)) return;
            setSaving(true);
            try {
              const updated = await updateTrainingWeek(blockId, weekNumber, { story: v });
              onPlanUpdated(updated);
            } finally {
              setSaving(false);
            }
          }}
          className='flex-1 text-sm border border-gray-200 rounded px-2 py-1'
          placeholder=''
        />
      </label>
    </div>
  );
}

const TABLE_HEADERS = (
  <thead>
    <tr className='bg-gray-100 text-xs text-gray-600 uppercase tracking-wide'>
      <th className='px-2 py-2 text-left'>Date</th>
      <th className='px-2 py-2 text-left'>Day</th>
      <th className='px-2 py-2 text-center'>Miles*</th>
      <th className='px-2 py-2 text-left'>Type</th>
      <th className='px-2 py-2 text-left'>Activity</th>
      <th className='px-2 py-2 text-center border-l border-gray-300'>Miles</th>
      <th className='px-2 py-2 text-right'>Pace</th>
      <th className='px-2 py-2 text-right'>Time</th>
      <th className='px-2 py-2 text-right'>Avg HR</th>
      <th className='px-2 py-2 text-right'>Cal</th>
      <th className='px-2 py-2 text-right'>Asc</th>
      <th className='px-2 py-2 text-right'>Diff</th>
    </tr>
  </thead>
);

export function BlockPlanGrid({ plan, onPlanUpdated, onActivityClick }: BlockPlanGridProps) {
  return (
    <div className='min-w-0'>
      <div className='space-y-8'>
        {plan.weeks.map((week) => (
          <section key={week.weekNumber} className='min-w-0'>
            <WeekSectionHeader
              weekNumber={week.weekNumber}
              story={week.story}
              blockId={plan.block.id}
              onPlanUpdated={onPlanUpdated}
            />
            <div className='w-full min-w-0 overflow-x-auto border border-gray-200 rounded-lg bg-white'>
              <table className='w-full table-fixed border-collapse' style={{ minWidth: PLAN_TABLE_MIN_WIDTH }}>
                {PLAN_TABLE_COLGROUP}
                {TABLE_HEADERS}
                <tbody>
                  {week.rows.map((row) => (
                    <PlanRow
                      key={row.id}
                      row={row}
                      blockId={plan.block.id}
                      onPlanUpdated={onPlanUpdated}
                      onActivityClick={onActivityClick}
                    />
                  ))}
                  <WeekSummaryRow summary={week.summary} />
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

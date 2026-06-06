import type { PlanWeekSummary, TrainingBlockPlan } from '../api/plan';

function emptyWeekSummary(weekNumber: number): PlanWeekSummary {
  return {
    weekNumber,
    plannedRuns: 0,
    plannedMiles: 0,
    actualMiles: 0,
    totalElapsedTime: 0,
    totalCalories: 0,
    heartRateSum: 0,
    heartRateCount: 0,
    diffMiles: 0,
  };
}

/** Ensures every week in the block has a section, even when no plan rows exist yet. */
export function normalizePlanWeeks(plan: TrainingBlockPlan): TrainingBlockPlan {
  const existingByWeek = new Map(plan.weeks.map((week) => [week.weekNumber, week]));
  const weeks = [];

  for (let weekNumber = 1; weekNumber <= plan.block.durationWeeks; weekNumber++) {
    const existing = existingByWeek.get(weekNumber);
    weeks.push(
      existing ?? {
        id: '',
        weekNumber,
        story: null,
        rows: [],
        summary: emptyWeekSummary(weekNumber),
      },
    );
  }

  return { ...plan, weeks };
}

export const ACTIVITY_ONLY_ROW_PREFIX = 'activity:';

export function isActivityOnlyRow(row: { id: string }): boolean {
  return row.id.startsWith(ACTIVITY_ONLY_ROW_PREFIX);
}

export function planHasPlannedRows(plan: TrainingBlockPlan): boolean {
  return plan.weeks.some((week) => week.rows.some((row) => !isActivityOnlyRow(row)));
}

export function planHasRows(plan: TrainingBlockPlan): boolean {
  return plan.weeks.some((week) => week.rows.length > 0);
}

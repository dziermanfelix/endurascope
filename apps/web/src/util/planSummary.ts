import type { PlanWeekSummary } from '../api/plan';

export function filterSummariesThroughWeek(
  summaries: PlanWeekSummary[],
  throughWeek: number | null,
): PlanWeekSummary[] {
  if (throughWeek === null) return [];
  return summaries.filter((summary) => summary.weekNumber <= throughWeek);
}

export function aggregatePlanSummaries(summaries: PlanWeekSummary[]): PlanWeekSummary {
  const aggregated = summaries.reduce(
    (acc, summary) => ({
      weekNumber: 0,
      plannedRuns: acc.plannedRuns + summary.plannedRuns,
      actualRuns: acc.actualRuns + (summary.actualRuns ?? 0),
      plannedMiles: acc.plannedMiles + summary.plannedMiles,
      actualMiles: acc.actualMiles + summary.actualMiles,
      totalElapsedTime: acc.totalElapsedTime + summary.totalElapsedTime,
      totalCalories: acc.totalCalories + summary.totalCalories,
      totalElevationGain: acc.totalElevationGain + summary.totalElevationGain,
      heartRateSum: acc.heartRateSum + summary.heartRateSum,
      heartRateCount: acc.heartRateCount + summary.heartRateCount,
      diffMiles: acc.diffMiles + summary.diffMiles,
    }),
    {
      weekNumber: 0,
      plannedRuns: 0,
      actualRuns: 0,
      plannedMiles: 0,
      actualMiles: 0,
      totalElapsedTime: 0,
      totalCalories: 0,
      totalElevationGain: 0,
      heartRateSum: 0,
      heartRateCount: 0,
      diffMiles: 0,
    },
  );

  return {
    ...aggregated,
    plannedMiles: Math.round(aggregated.plannedMiles * 100) / 100,
    actualMiles: Math.round(aggregated.actualMiles * 100) / 100,
    diffMiles: Math.round(aggregated.diffMiles * 100) / 100,
  };
}

export function averagePerWeek(total: number, weekCount: number): number {
  if (weekCount === 0) return 0;
  return Math.round((total / weekCount) * 100) / 100;
}

export function plannedVsActualMilesDiff(summary: PlanWeekSummary): number {
  return Math.round((summary.actualMiles - summary.plannedMiles) * 100) / 100;
}

export function plannedVsActualRunsDiff(summary: PlanWeekSummary): number {
  return (summary.actualRuns ?? 0) - summary.plannedRuns;
}

export function formatRunsDiff(diff: number): string {
  if (diff === 0) return '0 runs';
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff} ${Math.abs(diff) === 1 ? 'run' : 'runs'}`;
}

import type { PlanWorkoutRow } from '../api/plan';

export function buildSuggestedActivityNames(
  identifier: string,
  weeks: { rows: PlanWorkoutRow[] }[],
): Map<string, string> {
  const suggestions = new Map<string, string>();
  let sequence = 1;

  const allRows = weeks
    .flatMap((w) => w.rows)
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  for (const row of allRows) {
    const padded = String(sequence).padStart(3, '0');
    suggestions.set(row.id, `${identifier}${padded}`);
    sequence += 1;
  }

  return suggestions;
}

import type { PlanWeekSummary } from '../api/plan';
import { formatPace, formatTimeFromSeconds } from './time';

export function formatPlanDate(isoDate: string): string {
  const d = new Date(isoDate);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

export function formatPaceShort(secondsPerMile: number): string {
  const minutes = Math.floor(secondsPerMile / 60);
  const seconds = Math.floor(secondsPerMile % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function paceFromAverageSpeed(averageSpeed: number | null): string {
  return formatPace(averageSpeed) ?? '—';
}

export function averagePaceFromSummary(summary: PlanWeekSummary): string {
  if (summary.actualMiles === 0 || summary.totalElapsedTime === 0) return '—';
  const secondsPerMile = summary.totalElapsedTime / summary.actualMiles;
  return formatPaceShort(secondsPerMile);
}

export function averageHeartRateFromSummary(summary: PlanWeekSummary): string {
  if (summary.heartRateCount === 0) return '—';
  return Math.round(summary.heartRateSum / summary.heartRateCount).toString();
}

export function formatElevationFeet(meters: number | null): string {
  if (meters === null) return '';
  return Math.round(meters * 3.28084).toString();
}

export { formatTimeFromSeconds };

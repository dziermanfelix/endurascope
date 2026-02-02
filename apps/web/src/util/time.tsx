import type { WeekSummary } from './week';

export const formatTimeFromSeconds = (seconds: number): string => {
  if (seconds === 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  }
  if (m > 0) {
    return `${m}m ${s}s`;
  }
  return `${s}s`;
};

export const formatTimeFromHours = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
};

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const calculateAveragePaceFromSummary = (summary: WeekSummary): string | null => {
  if (summary.totalMiles === 0 || summary.totalTime === 0) return null;
  const secondsPerMile = summary.totalTime / summary.totalMiles;
  const minutes = Math.floor(secondsPerMile / 60);
  const seconds = Math.floor(secondsPerMile % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const calculatePace = (miles: number, timeSeconds: number): string | null => {
  if (miles === 0 || timeSeconds === 0) return null;
  const secondsPerMile = timeSeconds / miles;
  const minutes = Math.floor(secondsPerMile / 60);
  const seconds = Math.floor(secondsPerMile % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatPace = (averageSpeed: number | null): string | null => {
  if (!averageSpeed) return null;
  const METERS_PER_MILE = 1609.344;
  const paceSeconds = METERS_PER_MILE / averageSpeed;
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.round(paceSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
};

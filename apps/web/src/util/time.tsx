import { Activity } from '../types/activity';

export function formatDurationHms(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((part) => part.toString().padStart(2, '0')).join(':');
}

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

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

export const parseActivityDate = (activity: Activity): Date | null => {
  if (!activity.startDateLocal) return null;
  return new Date(activity.startDateLocal);
};

import { Activity } from '../types/activity';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function fetchActivities(): Promise<Activity[]> {
  const response = await fetch(`${API_BASE_URL}/activities`);
  if (!response.ok) {
    throw new Error('Failed to fetch activities');
  }
  return response.json();
}

export interface RefetchActivitiesResult {
  success: boolean;
  mode: 'incremental' | 'full';
  skipped?: boolean;
  fetched: number;
  created: number;
  updated: number;
  total: number;
}

export async function refetchActivitiesFromStrava(options?: {
  full?: boolean;
}): Promise<RefetchActivitiesResult> {
  const url = new URL(`${API_BASE_URL}/activities/refetch`);
  if (options?.full) {
    url.searchParams.set('full', 'true');
  }
  const response = await fetch(url.toString(), {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to refetch activities from Strava');
  }
  return response.json();
}

export async function updateActivityName(
  stravaId: string,
  name: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/activities/${stravaId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error('Failed to update activity name');
  }
  return response.json();
}

import { Activity } from '../types/activity';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function fetchActivities(): Promise<Activity[]> {
  const response = await fetch(`${API_BASE_URL}/activities`);
  if (!response.ok) {
    throw new Error('Failed to fetch activities');
  }
  return response.json();
}

export async function fetchActivityCount(): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/activities/count`);
  if (!response.ok) {
    throw new Error('Failed to fetch activity count');
  }
  const data = await response.json();
  return data.count;
}

export async function refetchActivitiesFromStrava(): Promise<{ success: boolean; fetched: number; total: number }> {
  const response = await fetch(`${API_BASE_URL}/activities/refetch`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to refetch activities from Strava');
  }
  return response.json();
}

export async function updateActivityName(stravaId: string, name: string): Promise<{ success: boolean; message: string }> {
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

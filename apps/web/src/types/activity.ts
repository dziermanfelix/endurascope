export interface ActivitySplit {
  split: number;
  moving_time: number;
  elapsed_time: number;
  average_speed: number;
  distance: number;
  elevation_difference: number;
  pace_zone?: number;
}

export interface Activity {
  id: string;
  stravaId: bigint | string;
  name: string | null;
  distance: number | null;
  elapsedTime: number | null;
  totalElevationGain: number | null;
  averageHeartRate: number | null;
  calories: number | null;
  averageSpeed: number | null;
  type: string | null;
  startDate: string | null;
  startDateLocal: string | null;
  splitsStandard: ActivitySplit[] | null;
  createdAt: string;
  updatedAt: string;
}

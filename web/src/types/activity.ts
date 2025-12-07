export interface Activity {
  id: string;
  stravaId: bigint | string;
  name: string | null;
  distance: number | null;
  movingTime: number | null;
  elapsedTime: number | null;
  totalElevationGain: number | null;
  averageHeartRate: number | null;
  calories: number | null;
  averageSpeed: number | null;
  type: string | null;
  startDate: string | null;
  startDateLocal: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingBlock {
  id: string;
  raceName: string;
  identifier: string;
  raceDate: Date;
  startDate: Date;
  durationWeeks: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTrainingBlockDto {
  raceName: string;
  identifier: string;
  raceDate: Date;
  startDate: Date;
  durationWeeks: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function fetchTrainingBlocks(): Promise<TrainingBlock[]> {
  const response = await fetch(`${API_BASE_URL}/api/training-blocks`);
  if (!response.ok) {
    throw new Error('Failed to fetch training blocks');
  }
  return response.json();
}

export async function createTrainingBlock(data: CreateTrainingBlockDto): Promise<TrainingBlock> {
  const response = await fetch(`${API_BASE_URL}/api/training-blocks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create training block');
  }

  return response.json();
}

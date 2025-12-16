export class CreateTrainingBlockDto {
  raceName: string;
  identifier: string;
  raceDate: Date;
  startDate: Date;
  durationWeeks: number;
}

export class UpdateTrainingBlockDto {
  raceName?: string;
  identifier?: string;
  raceDate?: Date;
  startDate?: Date;
  durationWeeks?: number;
}

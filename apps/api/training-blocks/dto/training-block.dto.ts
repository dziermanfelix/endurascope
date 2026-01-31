export class CreateTrainingBlockDto {
  raceName: string;
  identifier: string;
  raceDate: Date;
  startDate: Date;
}

export class UpdateTrainingBlockDto {
  raceName?: string;
  identifier?: string;
  raceDate?: Date;
  startDate?: Date;
}

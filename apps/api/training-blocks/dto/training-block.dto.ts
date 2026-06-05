export class CreateTrainingBlockDto {
  raceName: string;
  identifier: string;
  raceDate: Date;
  startDate: Date;
  goalTime?: string;
  goalDescription?: string;
}

export class UpdateTrainingBlockDto {
  raceName?: string;
  identifier?: string;
  raceDate?: Date;
  startDate?: Date;
  goalTime?: string | null;
  goalDescription?: string | null;
}

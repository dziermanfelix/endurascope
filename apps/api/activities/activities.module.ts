import { Module } from '@nestjs/common';
import { ActivitiesController } from './activities.controller';
import { StravaModule } from '../strava/strava.module';

@Module({
  imports: [StravaModule],
  controllers: [ActivitiesController],
})
export class ActivitiesModule {}



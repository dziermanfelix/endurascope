import { Module } from '@nestjs/common';
import { StravaService } from './strava.service';
import { StravaOAuthService } from './strava-oauth.service';
import { ActivityService } from './activity.service';

@Module({
  providers: [StravaService, StravaOAuthService, ActivityService],
  exports: [StravaService, StravaOAuthService, ActivityService],
})
export class StravaModule {}

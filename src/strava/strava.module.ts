import { Module } from '@nestjs/common';
import { StravaService } from './strava.service';
import { StravaOAuthService } from './strava-oauth.service';

@Module({
  providers: [StravaService, StravaOAuthService],
  exports: [StravaService, StravaOAuthService],
})
export class StravaModule {}

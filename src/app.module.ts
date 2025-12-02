import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StravaModule } from './strava/strava.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    StravaModule,
  ],
})
export class AppModule {}


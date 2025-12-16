import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { StravaModule } from './strava/strava.module';
import { ActivitiesModule } from './activities/activities.module';
import { TrainingBlocksModule } from './training-blocks/training-blocks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    StravaModule,
    ActivitiesModule,
    TrainingBlocksModule,
  ],
})
export class AppModule {}

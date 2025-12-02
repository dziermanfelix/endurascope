import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { StravaService } from './strava/strava.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  // Get Strava service and print activities
  const stravaService = app.get(StravaService);
  await stravaService.printActivities();
  
  await app.close();
}

bootstrap();


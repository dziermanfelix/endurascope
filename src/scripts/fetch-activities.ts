import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { StravaService } from '../strava/strava.service';
import { ActivityService } from '../strava/activity.service';

async function fetchActivities() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // Get services
  const stravaService = app.get(StravaService);
  const activityService = app.get(ActivityService);

  const activities = await stravaService.fetchActivities();

  if (activities.length > 0) {
    await activityService.saveActivities(activities);
    const count = await activityService.getActivityCount();
    console.log(`Total activities in database: ${count}`);
  }

  await app.close();
}

fetchActivities();



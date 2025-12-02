import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { StravaService } from '../strava/strava.service';
import { ActivityService } from '../strava/activity.service';

async function fetchActivities() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // Get services
  const stravaService = app.get(StravaService);
  const activityService = app.get(ActivityService);

  // Fetch activities
  console.log('Fetching activities from Strava...\n');
  const activities = await stravaService.fetchActivities();

  if (activities.length === 0) {
    console.log('No activities found.');
  } else {
    // Save activities to database
    await activityService.saveActivities(activities);

    // Print activities to console
    await stravaService.printActivities();

    // Show database stats
    const count = await activityService.getActivityCount();
    console.log(`\n📊 Total activities in database: ${count}`);
  }

  await app.close();
}

fetchActivities();



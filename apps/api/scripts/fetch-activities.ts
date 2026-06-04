import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { StravaService } from '../strava/strava.service';
import { ActivityService } from '../strava/activity.service';

async function fetchActivities() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const stravaService = app.get(StravaService);
  const activityService = app.get(ActivityService);
  const isFull = process.argv.includes('--full');

  let mode: 'incremental' | 'full';
  let activities;

  if (isFull) {
    mode = 'full';
    activities = await stravaService.fetchActivities({ full: true });
  } else {
    const since = await activityService.getLatestActivityStartDate();
    if (since) {
      mode = 'incremental';
      activities = await stravaService.fetchActivities({ after: since });
    } else {
      mode = 'full';
      activities = await stravaService.fetchActivities({ full: true });
    }
  }

  console.log(`Sync mode: ${mode}, fetched ${activities.length} activities from Strava`);

  if (activities.length > 0) {
    const { created, updated } = await activityService.saveActivities(activities);
    const count = await activityService.getActivityCount();
    console.log(`Saved: ${created} created, ${updated} updated. Total runs in database: ${count}`);
  }

  await app.close();
}

fetchActivities();



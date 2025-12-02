import { Controller, Get, Post } from '@nestjs/common';
import { ActivityService } from '../strava/activity.service';
import { StravaService } from '../strava/strava.service';

@Controller('api/activities')
export class ActivitiesController {
  constructor(
    private activityService: ActivityService,
    private stravaService: StravaService
  ) {}

  @Get()
  async getAllActivities() {
    const activities = await this.activityService.getAllActivities();
    return activities;
  }

  @Get('count')
  async getActivityCount() {
    const count = await this.activityService.getActivityCount();
    return { count };
  }

  @Post('refetch')
  async refetchActivities() {
    console.log('Refetching activities from Strava...');
    const activities = await this.stravaService.fetchActivities();
    await this.activityService.saveActivities(activities);
    const count = await this.activityService.getActivityCount();
    return {
      success: true,
      fetched: activities.length,
      total: count,
    };
  }
}

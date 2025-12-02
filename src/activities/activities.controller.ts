import { Controller, Get } from '@nestjs/common';
import { ActivityService } from '../strava/activity.service';

@Controller('api/activities')
export class ActivitiesController {
  constructor(private activityService: ActivityService) {}

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
}


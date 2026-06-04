import { Controller, Get, Post, Put, Body, Param, Query, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ActivityService } from '../strava/activity.service';
import { StravaService } from '../strava/strava.service';

@Controller('api/activities')
export class ActivitiesController {
  private readonly logger = new Logger(ActivitiesController.name);

  constructor(
    private activityService: ActivityService,
    private stravaService: StravaService,
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

  @Get('token-status')
  async getTokenStatus() {
    const tokenRecord = await this.stravaService.getTokenStatus();
    return {
      hasToken: !!tokenRecord,
      hasReadScope: tokenRecord?.scope?.includes('activity:read') || false,
      hasWriteScope: tokenRecord?.scope?.includes('activity:write') || false,
      scopes: tokenRecord?.scope?.split(',') || [],
      expiresAt: tokenRecord?.expiresAt || null,
    };
  }

  @Post('refetch')
  async refetchActivities(@Query('full') full?: string) {
    const isFull = full === 'true';
    let mode: 'incremental' | 'full';
    let activities;

    if (isFull) {
      mode = 'full';
      activities = await this.stravaService.fetchActivities({ full: true });
    } else {
      const since = await this.activityService.getLatestActivityStartDate();
      if (since) {
        mode = 'incremental';
        activities = await this.stravaService.fetchActivities({ after: since });
      } else {
        mode = 'full';
        activities = await this.stravaService.fetchActivities({ full: true });
      }
    }

    const { created, updated } = await this.activityService.saveActivities(activities);
    const count = await this.activityService.getActivityCount();
    return {
      success: true,
      mode,
      fetched: activities.length,
      created,
      updated,
      total: count,
    };
  }

  @Put(':stravaId')
  async updateActivity(@Param('stravaId') stravaId: string, @Body() updates: { name?: string }) {
    try {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new HttpException('Activity name cannot be empty', HttpStatus.BAD_REQUEST);
      }

      const stravaIdNumber = parseInt(stravaId, 10);
      if (isNaN(stravaIdNumber)) {
        throw new HttpException('Invalid Strava ID', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Updating activity ${stravaId} with name: ${updates.name}`);

      let updatedStravaActivity;
      try {
        updatedStravaActivity = await this.stravaService.updateActivity(stravaIdNumber, updates);
        this.logger.log(`Successfully updated activity ${stravaId} on Strava`);
      } catch (error) {
        this.logger.error(`Failed to update activity on Strava: ${error.message}`, error.stack);
        throw new HttpException(
          `Failed to update activity on Strava: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      try {
        await this.activityService.updateActivity(stravaId, updates);
        this.logger.log(`Successfully updated activity ${stravaId} in local database`);
      } catch (error) {
        this.logger.error(`Failed to update activity in local database: ${error.message}`, error.stack);
        try {
          if (updatedStravaActivity) {
            await this.activityService.saveActivities([updatedStravaActivity]);
          }
        } catch (syncError) {
          this.logger.error(`Failed to sync activity: ${syncError.message}`, syncError.stack);
        }
        throw new HttpException(
          `Failed to update activity in local database: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        success: true,
        message: 'Activity updated successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Unexpected error updating activity: ${error.message}`, error.stack);
      throw new HttpException(`Failed to update activity: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

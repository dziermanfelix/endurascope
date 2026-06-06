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
    const existingCount = await this.activityService.getActivityCount();

    if (isFull) {
      const activities = await this.stravaService.fetchActivities({ full: true });
      const { created, updated } = await this.activityService.saveActivities(activities);
      const count = await this.activityService.getActivityCount();
      return {
        success: true,
        mode: 'full' as const,
        fetched: activities.length,
        created,
        updated,
        total: count,
      };
    }

    const since = await this.activityService.getLatestActivityStartDate();
    if (!since) {
      if (existingCount > 0) {
        this.logger.warn('Skipping Strava sync: local activities exist but no sync cursor date');
        return {
          success: true,
          mode: 'incremental' as const,
          skipped: true,
          fetched: 0,
          created: 0,
          updated: 0,
          total: existingCount,
        };
      }

      const activities = await this.stravaService.fetchActivities({ full: true });
      const { created, updated } = await this.activityService.saveActivities(activities);
      const count = await this.activityService.getActivityCount();
      return {
        success: true,
        mode: 'full' as const,
        fetched: activities.length,
        created,
        updated,
        total: count,
      };
    }

    try {
      const activities = await this.stravaService.fetchActivities({ after: since });
      const { created, updated } = await this.activityService.saveActivities(activities);
      const count = await this.activityService.getActivityCount();
      return {
        success: true,
        mode: 'incremental' as const,
        fetched: activities.length,
        created,
        updated,
        total: count,
      };
    } catch (error) {
      if (existingCount > 0) {
        this.logger.warn(
          `Incremental Strava sync failed, using ${existingCount} cached activities: ${error instanceof Error ? error.message : error}`,
        );
        return {
          success: true,
          mode: 'incremental' as const,
          skipped: true,
          fetched: 0,
          created: 0,
          updated: 0,
          total: existingCount,
        };
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(`Failed to refetch activities from Strava: ${message}`, HttpStatus.BAD_GATEWAY);
    }
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

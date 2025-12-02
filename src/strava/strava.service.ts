import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios, { AxiosInstance } from 'axios';
import { StravaOAuthService } from './strava-oauth.service';

export interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  start_date: string;
  start_date_local: string;
  timezone: string;
  utc_offset: number;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  trainer: boolean;
  commute: boolean;
  manual: boolean;
  private: boolean;
  flagged: boolean;
  workout_type: number | null;
  upload_id: number | null;
  external_id: string | null;
}

@Injectable()
export class StravaService {
  private readonly apiClient: AxiosInstance;
  private accessToken: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    @Optional() private oauthService?: StravaOAuthService
  ) {
    this.apiClient = axios.create({
      baseURL: 'https://www.strava.com/api/v3',
    });
  }

  async initializeToken(): Promise<void> {
    const clientId = this.configService.get<string>('STRAVA_CLIENT_ID');
    const clientSecret = this.configService.get<string>('STRAVA_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error(
        'Missing Strava credentials. Please set STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET in your .env file.'
      );
    }

    // Try to get token from database
    let tokenRecord = await this.prisma.stravaToken.findFirst();

    // If no token in database, automatically authorize
    if (!tokenRecord) {
      if (!this.oauthService) {
        throw new Error('No token found in database and OAuth service not available. Please authorize first.');
      }
      console.log('No token found in database. Starting OAuth authorization...\n');
      await this.oauthService.authorize();
      // Try to get token again after authorization
      tokenRecord = await this.prisma.stravaToken.findFirst();
    }

    if (!tokenRecord) {
      throw new Error('Failed to get token after authorization. Please try again.');
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const now = new Date();
    const expiresAt = new Date(tokenRecord.expiresAt);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    let refreshToken = tokenRecord.refreshToken;
    let shouldRefresh = expiresAt <= fiveMinutesFromNow;

    // Refresh token if expired or about to expire
    if (shouldRefresh) {
      try {
        const response = await axios.post('https://www.strava.com/oauth/token', {
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        });

        const newAccessToken = response.data.access_token;
        const newRefreshToken = response.data.refresh_token;
        const newExpiresAt = new Date(response.data.expires_at * 1000);
        const scope = response.data.scope || null;

        // Update token in database
        await this.prisma.stravaToken.update({
          where: { id: tokenRecord.id },
          data: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresAt: newExpiresAt,
            scope: scope,
          },
        });

        this.accessToken = newAccessToken;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to refresh Strava token: ${errorMessage}`);
      }
    } else {
      // Use existing access token
      this.accessToken = tokenRecord.accessToken;
    }

    this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
  }

  async fetchActivities(page: number = 1, perPage: number = 30): Promise<StravaActivity[]> {
    if (!this.accessToken) {
      await this.initializeToken();
    }

    try {
      const response = await this.apiClient.get('/athlete/activities', {
        params: {
          page,
          per_page: perPage,
        },
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Check if it's a missing permission error
        const errors = error.response?.data?.errors || [];
        const missingPermission = errors.find(
          (e: any) => e.field === 'activity:read_permission' && e.code === 'missing' && e.resource === 'AccessToken'
        );

        if (missingPermission) {
          if (!this.oauthService) {
            throw new Error(
              'Token missing required permissions. Please re-authorize your application with the scope activity:read_all.'
            );
          }
          console.log('Token missing required permissions. Re-authorizing...\n');
          await this.oauthService.authorize();
          // Retry with new token
          await this.initializeToken();
          const retryResponse = await this.apiClient.get('/athlete/activities', {
            params: {
              page,
              per_page: perPage,
            },
          });
          return retryResponse.data;
        }

        // Token expired, refresh and retry
        await this.initializeToken();
        const retryResponse = await this.apiClient.get('/athlete/activities', {
          params: {
            page,
            per_page: perPage,
          },
        });
        return retryResponse.data;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch activities: ${errorMessage}`);
    }
  }

  async printActivities(): Promise<void> {
    console.log('Fetching activities from Strava...\n');
    const activities = await this.fetchActivities();

    if (activities.length === 0) {
      console.log('No activities found.');
      return;
    }

    console.log(`Found ${activities.length} activities:\n`);
    console.log('='.repeat(80));

    activities.forEach((activity, index) => {
      console.log(`\nActivity ${index + 1}:`);
      console.log(`  Name: ${activity.name}`);
      console.log(`  Type: ${activity.type}`);
      console.log(`  Distance: ${(activity.distance / 1000).toFixed(2)} km`);
      console.log(`  Moving Time: ${this.formatTime(activity.moving_time)}`);
      console.log(`  Elapsed Time: ${this.formatTime(activity.elapsed_time)}`);
      console.log(`  Elevation Gain: ${activity.total_elevation_gain} m`);
      console.log(`  Start Date: ${new Date(activity.start_date_local).toLocaleString()}`);
      console.log(`  Kudos: ${activity.kudos_count}`);
      console.log(`  Comments: ${activity.comment_count}`);
      if (activity.location_city || activity.location_state || activity.location_country) {
        const location = [activity.location_city, activity.location_state, activity.location_country]
          .filter(Boolean)
          .join(', ');
        console.log(`  Location: ${location}`);
      }
    });

    console.log('\n' + '='.repeat(80));
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
}

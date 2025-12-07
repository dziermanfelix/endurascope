import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import { createServer, Server } from 'http';
import { parse } from 'url';
import open from 'open';

@Injectable()
export class StravaOAuthService {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async authorize(): Promise<string> {
    const clientId = this.configService.get<string>('STRAVA_CLIENT_ID');
    const clientSecret = this.configService.get<string>('STRAVA_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error(
        'Missing STRAVA_CLIENT_ID or STRAVA_CLIENT_SECRET. Please set these in your .env file.',
      );
    }

    const redirectUri = 'http://localhost:3000/callback';
    const authUrl = `http://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=force&scope=activity:read_all,activity:write`;


    return new Promise((resolve, reject) => {
      const server: Server = createServer(async (req, res) => {
        const parsedUrl = parse(req.url || '', true);
        const query = parsedUrl.query;

        if (parsedUrl.pathname === '/callback') {
          if (query.error) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(
              `<html><body><h1>Authorization Failed</h1><p>${query.error}: ${query.error_description}</p></body></html>`,
            );
            server.close();
            reject(new Error(`Authorization failed: ${query.error}`));
            return;
          }

          const code = query.code as string;
          if (!code) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(
              '<html><body><h1>Error</h1><p>No authorization code received</p></body></html>',
            );
            server.close();
            reject(new Error('No authorization code received'));
            return;
          }

          try {
            // Exchange code for tokens
            const tokenResponse = await axios.post(
              'https://www.strava.com/oauth/token',
              {
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                grant_type: 'authorization_code',
              },
            );

            const accessToken = tokenResponse.data.access_token;
            const refreshToken = tokenResponse.data.refresh_token;
            const expiresAt = new Date(tokenResponse.data.expires_at * 1000);
            
            // Handle scope - it might be a string or array
            let scope: string | null = null;
            if (tokenResponse.data.scope) {
              if (Array.isArray(tokenResponse.data.scope)) {
                scope = tokenResponse.data.scope.join(',');
              } else {
                scope = tokenResponse.data.scope;
              }
            }
            
            const athleteId = tokenResponse.data.athlete?.id?.toString() || null;

            // Save tokens to database
            await this.prisma.stravaToken.upsert({
              where: { userId: athleteId },
              create: {
                userId: athleteId,
                accessToken: accessToken,
                refreshToken: refreshToken,
                expiresAt: expiresAt,
                scope: scope,
              },
              update: {
                accessToken: accessToken,
                refreshToken: refreshToken,
                expiresAt: expiresAt,
                scope: scope,
              },
            });

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(
              '<html><body><h1>Success!</h1><p>Authorization successful. You can close this window and return to the terminal.</p><script>setTimeout(() => window.close(), 2000);</script></body></html>',
            );

            server.close();
            resolve(refreshToken);
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(
              `<html><body><h1>Error</h1><p>Failed to exchange authorization code: ${error instanceof Error ? error.message : 'Unknown error'}</p></body></html>`,
            );
            server.close();
            reject(error);
          }
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
      });

      server.listen(3000, () => {
        // Open browser after server starts
        open(authUrl).catch((err) => {
          console.error('Failed to open browser:', err);
          console.log(`Please manually visit: ${authUrl}`);
        });
      });

      server.on('error', (err) => {
        reject(err);
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        server.close();
        reject(new Error('Authorization timeout. Please try again.'));
      }, 5 * 60 * 1000);
    });
  }
}


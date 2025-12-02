# Endurascope

A proof of concept NestJS application for connecting to Strava and fetching activities.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Strava API Setup

To connect to Strava, you need to:

1. Go to [Strava API Settings](https://www.strava.com/settings/api)
2. Create a new application or use an existing one
   - **Authorization Callback Domain**: Enter `localhost` (no `http://` or port)
   - **Application Name**: Choose any name you like
   - **Category**: Choose any category
   - **Website**: Optional, can leave blank or use any URL
3. Note down your **Client ID** and **Client Secret**

**That's it!** The application will automatically handle OAuth authorization when you first run it.

### 3. Environment Variables

Create a `.env` file in the root directory with your Strava credentials:

```bash
STRAVA_CLIENT_ID=your_client_id_here
STRAVA_CLIENT_SECRET=your_client_secret_here
```

**Note**: You don't need to set `STRAVA_REFRESH_TOKEN` manually. The application will automatically handle OAuth authorization on first run, open your browser, and save the refresh token for you.

### 4. Run the Application

```bash
npm run start:dev
```

The application will:

1. Automatically open your browser for Strava authorization (if needed)
2. Handle the OAuth callback and save your refresh token
3. Fetch your Strava activities and print them to the console

**First Run**: On your first run, if you don't have a refresh token, the app will:

- Start a temporary web server on port 3000
- Open your browser to authorize with Strava
- Handle the callback automatically
- Save your refresh token to the `.env` file
- Then proceed to fetch and display your activities

**Subsequent Runs**: Once you have a refresh token saved, the app will use it directly without requiring browser authorization.

## Troubleshooting

### Port 3000 Already in Use

If you see an error about port 3000 being in use, either:

- Close the application using port 3000, or
- The OAuth flow might still be waiting. Wait a moment and try again.

### Authorization Timeout

If the authorization times out, simply run the application again. The OAuth flow will restart automatically.

### Token Missing Permissions

If you get an error about missing permissions, the app will automatically re-authorize with the correct permissions. Just follow the browser prompts again.

## Project Structure

```
src/
├── main.ts                    # Application entry point
├── app.module.ts              # Root module
└── strava/
    ├── strava.module.ts       # Strava module
    ├── strava.service.ts      # Strava API service
    └── strava-oauth.service.ts # OAuth authorization service
```

## Features

- ✅ Automatic OAuth authorization flow
- ✅ Browser-based authentication (no manual token setup needed)
- ✅ Connect to Strava API
- ✅ Authenticate using OAuth refresh tokens
- ✅ Fetch athlete activities
- ✅ Print activities to console with formatted details

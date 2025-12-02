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

### 3. Database Setup

This application uses PostgreSQL with Prisma as the ORM.

1. **Install PostgreSQL** (if not already installed)
   - macOS: `brew install postgresql@15`
   - Linux: `sudo apt-get install postgresql`
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/)

2. **Create a database**:

   ```bash
   createdb endurascope
   ```

3. **Run migrations**:
   ```bash
   npm run prisma:migrate
   ```
   This will create the necessary tables for tokens and activities.

### 4. Environment Variables

Create a `.env` file in the root directory with your credentials:

```bash
# Strava API Credentials
STRAVA_CLIENT_ID=your_client_id_here
STRAVA_CLIENT_SECRET=your_client_secret_here

# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/endurascope?schema=public"
```

**Note**:

- Replace `username`, `password`, and database name in `DATABASE_URL` with your PostgreSQL credentials
- You don't need to set `STRAVA_REFRESH_TOKEN` manually. Tokens are automatically saved to the database after OAuth authorization.

### 5. Run the Application

```bash
npm run start:dev
```

The application will:

1. Automatically open your browser for Strava authorization (if needed)
2. Handle the OAuth callback and save tokens to the database
3. Fetch your Strava activities
4. Save activities to the database
5. Print activities to the console

**First Run**: On your first run, if you don't have tokens in the database, the app will:

- Start a temporary web server on port 3000
- Open your browser to authorize with Strava
- Handle the callback automatically
- Save tokens to the database
- Then proceed to fetch, save, and display your activities

**Subsequent Runs**: Once you have tokens saved in the database, the app will use them directly without requiring browser authorization.

## Database Management

### View Database with Prisma Studio

```bash
npm run prisma:studio
```

This opens a web interface where you can view and manage your tokens and activities.

### Run Migrations

When the schema changes, run:

```bash
npm run prisma:migrate
```

### Generate Prisma Client

After schema changes, regenerate the Prisma client:

```bash
npm run prisma:generate
```

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
├── prisma/
│   ├── prisma.module.ts       # Prisma module (global)
│   └── prisma.service.ts      # Prisma service
└── strava/
    ├── strava.module.ts       # Strava module
    ├── strava.service.ts      # Strava API service
    ├── strava-oauth.service.ts # OAuth authorization service
    └── activity.service.ts    # Activity database service
```

## Features

- ✅ Automatic OAuth authorization flow
- ✅ Browser-based authentication (no manual token setup needed)
- ✅ PostgreSQL database with Prisma ORM
- ✅ Token storage in database (automatically refreshed)
- ✅ Activity storage in database
- ✅ Connect to Strava API
- ✅ Authenticate using OAuth refresh tokens
- ✅ Fetch athlete activities
- ✅ Print activities to console with formatted details

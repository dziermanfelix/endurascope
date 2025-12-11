# Endurascope

A proof of concept NestJS application for connecting to Strava and fetching activities.

## Setup

### 1. Install Dependencies

```bash
npm install
```

This will install all dependencies for both the backend and web frontend using npm workspaces. You only need to run this once from the root directory!

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

**Run both web and backend together:**

```bash
npm run dev
```

This will start:

- Backend API server on `http://localhost:3001`
- Web development server on `http://localhost:5173`

**Or run them separately:**

```bash
# Backend only
npm run dev:api

# Web only (in a separate terminal)
npm run web:dev
```

**Fetch activities from Strava:**

```bash
npm run fetch:activities
```

## Usage

**Frontend (Web UI):**

- Open `http://localhost:5173` in your browser
- View all your Strava activities in a beautiful, responsive interface

**Backend API:**

- API is available at `http://localhost:3001/api`
- Endpoints:
  - `GET /api/activities` - Get all activities
  - `GET /api/activities/count` - Get activity count

**Fetch New Activities:**

- Run `npm run fetch:activities` to fetch latest activities from Strava
- Activities are automatically saved to the database

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
├── apps/
│   ├── web/                   # React + TypeScript web frontend
│   │   ├── src/
│   │   │   ├── App.tsx       # Main app component
│   │   │   ├── components/   # React components
│   │   │   ├── api/          # API client
│   │   │   └── types/        # TypeScript types
│   │   └── package.json
│   └── api/                   # NestJS backend
│       ├── main.ts            # Application entry point
│       ├── app.module.ts      # Root module
│       ├── activities/        # Activities API module
│       ├── prisma/
│       │   ├── prisma.module.ts  # Prisma module (global)
│       │   └── prisma.service.ts # Prisma service
│       └── strava/
│           ├── strava.module.ts
│           ├── strava.service.ts
│           ├── strava-oauth.service.ts
│           └── activity.service.ts
├── prisma/                    # Prisma schema and migrations
└── package.json               # Root package.json with workspaces
```

## Features

- ✅ **React + TypeScript Frontend** - Modern, responsive UI with Tailwind CSS
- ✅ **NestJS Backend API** - RESTful API with TypeScript
- ✅ **Automatic OAuth Flow** - Browser-based authentication (no manual token setup)
- ✅ **PostgreSQL Database** - Persistent storage with Prisma ORM
- ✅ **Token Management** - Automatic token refresh and storage
- ✅ **Activity Display** - Beautiful activity cards with all details
- ✅ **Real-time Data** - Fetch latest activities from Strava

# Time Management

Modern project time tracker with **Next.js** frontend, **Node.js** backend, **Tailwind CSS**, and **Firebase Realtime Database**.

## Features

- Login / Sign up (JWT auth)
- Create private projects (each user only sees their own)
- **Start** / **End** timer with live countdown animation
- Pakistan timezone (`Asia/Karachi`) for date, day, and clocks
- Session history — how much time on each project
- Weekly graph — hours per project (Mon–Sun, PK time)
- Light + Dark mode
- SEO (metadata, sitemap, robots, Open Graph) + favicon
- AWS-ready (Amplify + Docker) — see `AWS.md`

## Project structure

```
backend/     Node.js + Express API
frontend/    Next.js + Tailwind UI
```

## 1. Backend setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API runs at `http://localhost:5000`.

### Firebase Realtime Database

Database URL:

```
FIREBASE_DATABASE_URL=https://tracking-4e060-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=tracking-4e060
```

Add the **service account key** (required — DB is private):

1. Open [Firebase Console](https://console.firebase.google.com/) → project **tracking-4e060**
2. Gear icon → **Project settings** → **Service accounts**
3. Click **Generate new private key** → download the JSON
4. Rename/copy it to:
   `backend/serviceAccountKey.json`
5. Restart backend (`npm run dev`)

You should see:
`✓ Firebase Realtime Database connected: https://tracking-4e060-default-rtdb.firebaseio.com`

## 2. Frontend setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App runs at `http://localhost:3000` (or next free port).

`frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## AWS deploy

See **[AWS.md](./AWS.md)** for Amplify, EC2, ECS, and Docker Compose.

## Usage

1. Sign up → open Dashboard
2. **New project** → create a project
3. Press **Start** → countdown begins (Pakistan time)
4. Press **End** → timer stops and session is saved
5. Open **History** and **Week graph** to review time spent

## Security note

Projects and sessions are stored under each user id (`projects/{userId}`, `sessions/{userId}`). The API always scopes queries to the authenticated user — users cannot see each other’s data.

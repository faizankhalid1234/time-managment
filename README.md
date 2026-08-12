# Time Management

One Next.js app — UI + API together.

```
frontend/
  src/app/          pages
  src/app/api/      backend (auth, projects, timers)
  src/lib/server/   Firebase, JWT, time helpers
  .env.example
```

## Run

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

## Env (`frontend/.env.local`)

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=/api
JWT_SECRET=change_this_to_a_long_random_secret_key
FIREBASE_DATABASE_URL=https://tracking-4e060-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=tracking-4e060
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

Put Firebase key at `frontend/serviceAccountKey.json` (do not commit).

If Firebase is not set, a local JSON file is used: `frontend/data/local-db.json`.

## AWS

See [AWS.md](./AWS.md)

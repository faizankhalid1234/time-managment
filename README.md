# Time Management

Next.js app — UI + API together. Vercel deploys from the repo root.

```
src/app/          pages
src/app/api/      backend (auth, projects, timers)
src/lib/server/   Firebase, JWT, time helpers
.env.example
```

## Run

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

## Vercel

1. Import this GitHub repo
2. **Root Directory:** leave empty (`.`)
3. Framework: Next.js (auto)
4. Add environment variables from `.env.example`
5. Deploy

Do not set Root Directory to `frontend`.

## Env

```
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
NEXT_PUBLIC_API_URL=/api
JWT_SECRET=change_this_to_a_long_random_secret_key
FIREBASE_DATABASE_URL=https://tracking-4e060-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=tracking-4e060
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

On Vercel, paste `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` from your service account JSON. Do not use `FIREBASE_SERVICE_ACCOUNT_PATH` on Vercel.

## AWS

See [AWS.md](./AWS.md)

# AWS deployment — Time Management

Single Next.js app (UI + API) at the repo root.

## Amplify
1. Connect this GitHub repo
2. App root: repository root (not `frontend/`)
3. Build: `amplify.yml`
4. Env vars:
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_API_URL=/api`
   - `JWT_SECRET`
   - `FIREBASE_DATABASE_URL`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

## Docker / EC2

```bash
docker compose up -d --build
```

Or:

```bash
docker build -t time-management .
docker run -d -p 3000:3000 --env-file .env.local time-management
```

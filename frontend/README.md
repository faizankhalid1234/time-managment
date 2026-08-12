# Time Management — App

Next.js UI + API in one project.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Env

See `.env.example`. Server secrets (`JWT_SECRET`, Firebase) stay in `.env.local` — never `NEXT_PUBLIC_`.

## API routes

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET|POST /api/projects`
- `POST /api/projects/:id/start`
- `POST /api/projects/:id/stop`
- `DELETE /api/projects/:id`
- `GET /api/projects/history/sessions`
- `GET /api/projects/stats/weekly`

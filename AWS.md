# AWS deployment — Trackora

## Option A: AWS Amplify (Frontend) + EC2/ECS (API)

### 1) Frontend on Amplify
1. Push this repo to GitHub
2. AWS Amplify → New app → Host web app → select `frontend/`
3. Build settings: use `frontend/amplify.yml`
4. Environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://api.yourdomain.com/api`
   - `NEXT_PUBLIC_SITE_URL` = `https://your-amplify-domain.amplifyapp.com`

### 2) Backend on EC2 (simple)
```bash
# On Ubuntu EC2
sudo apt update && sudo apt install -y docker.io
git clone YOUR_REPO
cd YOUR_REPO/backend
# add serviceAccountKey.json + .env
sudo docker build -t trackora-api .
sudo docker run -d -p 5000:5000 --env-file .env \
  -v $(pwd)/serviceAccountKey.json:/app/serviceAccountKey.json:ro \
  --name trackora-api trackora-api
```

Open port **5000** (or put Nginx + HTTPS in front).

### 3) Backend on ECS/Fargate
1. Push `backend` image to **ECR**
2. Create ECS task with env vars from `backend/.env`
3. Mount/inject `serviceAccountKey.json` via Secrets Manager
4. ALB target group → port 5000

## Option B: Docker Compose on one EC2

```bash
export NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
export NEXT_PUBLIC_SITE_URL=https://yourdomain.com
docker compose up -d --build
```

## Required env

**Frontend**
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SITE_URL` (used for SEO canonical + sitemap)

**Backend**
- `JWT_SECRET`
- `FIREBASE_DATABASE_URL=https://tracking-4e060-default-rtdb.firebaseio.com`
- `FIREBASE_PROJECT_ID=tracking-4e060`
- `FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json`
- `FRONTEND_URL=https://yourdomain.com`

## SEO checklist after deploy
- Confirm `https://YOUR_DOMAIN/sitemap.xml`
- Confirm `https://YOUR_DOMAIN/robots.txt`
- Confirm favicon at `/icon`
- Submit sitemap in Google Search Console

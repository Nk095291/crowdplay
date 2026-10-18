# CrowdPlay

The crowd picks the music. Start a room, guests join from their phones, add songs and vote — the queue reorders live.

See [PRD.md](PRD.md) for the product spec.

## Stack

| Part | Tech |
|---|---|
| `frontend/` | React 19 + TypeScript + Vite |
| `backend/` | Django + DRF + Channels (ASGI via uvicorn), managed with `uv` |
| Real-time & cache | Redis |
| Database | Postgres on Railway, SQLite locally by default |

## Run locally

Prereqs: `uv`, Node, and Redis running (`brew services start redis`).

```bash
# Backend → http://localhost:8000
cd backend
cp .env.example .env
uv sync
uv run python manage.py migrate
uv run uvicorn config.asgi:application --port 8000 --reload

# Frontend → http://localhost:5173   (in a second terminal)
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` and `/ws` to Django, so no CORS setup is needed locally.
Check everything is wired up: `curl localhost:8000/api/health/` → `{"api":"ok","database":"ok","redis":"ok"}`.

## Deploy (Railway)

One Railway project with these services:

1. **Redis** — *New → Database → Redis*. Railway runs and manages the container; no Docker Compose needed.
2. **Postgres** — *New → Database → PostgreSQL*.
3. **backend** — *New → GitHub repo*, **Root Directory** `/backend`. Config lives in `backend/railway.json` (runs migrations pre-deploy, starts uvicorn, healthcheck on `/api/health/`). Variables:
   ```
   REDIS_URL=${{Redis.REDIS_URL}}
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   DJANGO_SECRET_KEY=<generate a long random string>
   DJANGO_DEBUG=false
   CORS_ALLOWED_ORIGINS=https://<your-frontend-domain>
   ```
   Then *Settings → Networking → Generate Domain*.
4. **frontend** — Railway (Root Directory `/frontend`) or Vercel. Set `VITE_API_URL=https://<backend-domain>`.

Service names in `${{...}}` must match what the services are called in your Railway project.

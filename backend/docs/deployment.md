# Deployment (Railway)

One Railway project:

1. **Redis** — *New → Database → Redis*. Managed by Railway.
2. **backend** — *New → GitHub repo*, Root Directory `/backend`.
   *Settings → Networking → Generate Domain* for a public URL.

## `backend/railway.json`

| Field | Value |
|---|---|
| Builder | `RAILPACK` |
| Start command | `uvicorn config.asgi:application --host 0.0.0.0 --port $PORT` |
| Healthcheck | `/api/health/` (fails with 503 if Redis is down) |
| Restart policy | `ON_FAILURE` |

## Service variables

```
REDIS_URL=${{Redis.REDIS_URL}}
DJANGO_SECRET_KEY=<long random string>
DJANGO_DEBUG=false
CORS_ALLOWED_ORIGINS=https://<frontend-domain>
```

`RAILWAY_PUBLIC_DOMAIN` is injected by Railway and added to `ALLOWED_HOSTS`
automatically. The service name inside `${{...}}` must match the Redis
service's name in the project. Full variable list: [configuration.md](configuration.md).

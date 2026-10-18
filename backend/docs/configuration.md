# Configuration

All config comes from environment variables. Locally they're read from
`backend/.env` (copy `.env.example`); on Railway they're service variables.

| Variable | Default | Drives |
|---|---|---|
| `DJANGO_SECRET_KEY` | `dev-insecure-change-me` | `SECRET_KEY`. Set a long random value in production |
| `DJANGO_DEBUG` | `false` | `DEBUG` (`"true"` enables it) |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1` | `ALLOWED_HOSTS` (comma-separated) |
| `RAILWAY_PUBLIC_DOMAIN` | unset | Set by Railway; appended to `ALLOWED_HOSTS` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Frontend origin(s) allowed by CORS (comma-separated) |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection, see [redis.md](redis.md) |

When `DEBUG` is off, `SECURE_PROXY_SSL_HEADER` trusts
`X-Forwarded-Proto: https` because Railway terminates TLS at its proxy.

Other fixed settings: `TIME_ZONE = "UTC"`, `USE_TZ = True`, DRF renders JSON
only with no authentication.

Adding a variable: read it in `config/settings.py`, add it to
`.env.example`, and add a row here.

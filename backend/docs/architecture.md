# Architecture

## Stack

| Part | Tech |
|---|---|
| Language | Python 3.13 (pinned in `.python-version`), managed with `uv` |
| Framework | Django 6.1 + Django REST Framework (JSON renderer only) |
| Server | uvicorn, serving Django's ASGI app |
| Store | Redis, via `django-redis` (Django cache API) |
| CORS | `django-cors-headers` |
| Config | env vars, loaded from `backend/.env` locally by `python-dotenv` |

There is **no SQL database** (`DATABASES = {}`), so no models, migrations,
admin, auth or sessions.

## Layout

```
backend/
├── config/            Django project
│   ├── settings.py    All settings; env-driven (see configuration.md)
│   ├── urls.py        Mounts core.urls under /api/
│   └── asgi.py        ASGI entrypoint served by uvicorn
├── core/              The only app
│   ├── apps.py
│   ├── urls.py        /api/health/
│   └── views.py       health view
├── docs/              These docs
├── manage.py
├── pyproject.toml     Dependencies
├── uv.lock
├── railway.json       Railway build/deploy config
└── .env.example       Template for backend/.env
```

## Request flow

```
client ──HTTP──▶ uvicorn ──▶ config.asgi (Django)
                              ├─ SecurityMiddleware
                              ├─ CorsMiddleware
                              ├─ CommonMiddleware
                              └─ config.urls ─▶ core.urls ─▶ core.views
                                                               │
                                                     django cache API
                                                               ▼
                                                             Redis
```

Middleware is limited to security headers, CORS and common handling. CSRF and
clickjacking middleware were removed because there are no cookies, sessions or
HTML pages.

## Built vs. planned

| Area | Status |
|---|---|
| Redis connection (cache) | Built |
| `GET /api/health/` | Built |
| Party state in Redis (PRD data model) | *Planned* — see [redis.md](redis.md#planned-key-model) |
| REST: create / join party, add song | *Planned* — PRD "Technical approach" |
| WebSockets (live votes, queue, comments) | *Planned* — removed for now, see [decisions.md](decisions.md) |

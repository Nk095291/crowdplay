# Decisions

Newest first. Each entry: date, decision, why, and what it affects.

## 2026-10-18 — Strip backend to Redis connection + health API

**Decision:** Removed Django Channels (WebSocket consumer, routing,
`CHANNEL_LAYERS`, `channels`, `channels-redis`), whitenoise and static files,
templates, the DRF browsable API, `config/wsgi.py`, and CSRF/clickjacking
middleware.

**Why:** Nothing is implemented yet; the scaffolding was an echo-only demo
and unused config. Starting from the minimum keeps each feature's additions
explicit.

**Affects:** The frontend room/WebSocket demo, the `/ws` Vite proxy and
Redis mentions in the UI were removed in the same pass; the status pill now
checks `/api/health/` at most twice per page load instead of polling every
10 s. Real-time comes back with the party
features (PRD "Realtime events"), most likely by re-adding Channels with the
Redis channel layer.

## 2026 — Python pinned to 3.13

**Decision:** `backend/.python-version` = `3.13`, `requires-python >=3.13`.

**Why:** Match the PRD stack and keep local and Railway builds on the same
interpreter.

## 2026 — Django instead of FastAPI

**Decision:** Build the backend with Django + DRF (ASGI on uvicorn) instead of
the PRD's FastAPI.

**Why:** Batteries-included project structure; Channels gives a ready Redis
pub/sub layer for WebSockets across instances. Everything else in the PRD's
technical approach still applies.

## 2026 — No SQL database; Redis holds all state

**Decision:** `DATABASES = {}`. Party state lives in Redis with a 12 h TTL.

**Why:** Parties are short-lived; nothing needs to outlive one yet. Add a
database only when we need durable data (accounts, history).

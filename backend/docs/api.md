# API

Base path: `/api/`. All responses are JSON. No authentication (DRF
`AllowAny`, no auth classes); host/guest identity will come from tokens and
device IDs per the PRD.

## `GET /api/health/`

Liveness check. Used by the frontend status pill and the Railway healthcheck.
The frontend calls it at most twice per page load (once, plus one retry after
3 s only if the first fails); see `frontend/src/lib/api.ts`. Keep it that way
so the frontend doesn't poll the backend.

Writes the cache key `healthcheck` = `"ok"` (5 s TTL) to Redis and reads it
back.

| Status | Body | When |
|---|---|---|
| 200 | `{"api": "ok", "redis": "ok"}` | Redis round-trip succeeded |
| 503 | `{"api": "ok", "redis": "error"}` | Redis unreachable, or the value read back didn't match |

Code: `core/views.py` (`health`), routed in `core/urls.py`.

```bash
curl localhost:8000/api/health/
```

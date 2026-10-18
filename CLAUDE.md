# CLAUDE.md

This file gives Claude Code guidance for working in this repository.

## Project

CrowdPlay ("Room DJ"): a shared party queue. A host runs a party screen that plays YouTube songs; guests join by QR/link from their phones to add songs, vote and comment, no login.

- **Spec:** [`PRD.md`](PRD.md) is the repo copy of the [Room DJ PRD doc](https://claude.ai/artifact/BTNbsTd7UZEDKozjdF3K1C). The doc is the source of truth; if they differ, update the doc first, then `PRD.md`. Feature IDs (F1–F17) and decision IDs (D1–D14) come from it — reference them in PRs and code comments.
- **Remote:** https://github.com/Nk095291/crowdplay.git · default branch `main`

## Stack

| Part | Tech |
|---|---|
| `frontend/` | React 19 + TypeScript + Vite; lint with oxlint |
| `backend/` | Django + DRF + Channels, ASGI on uvicorn; Python 3.13 managed with `uv` |
| State | **Redis only** — party state, cache, and the Channels layer. No SQL database (`DATABASES = {}`), so no admin/auth/sessions apps and no migrations. See PRD "Technical design" for the Redis key layout |
| Deploy | Railway (backend + Redis, config in `backend/railway.json`) |

The PRD's technical design says FastAPI; we deliberately use Django + Channels instead (noted in `PRD.md`). Everything else in that design applies.

## Commands

```bash
# Prereq: Redis running locally
brew services start redis

# Backend → http://localhost:8000  (API under /api/, WebSocket at /ws/{code})
cd backend && uv sync
uv run uvicorn config.asgi:application --port 8000 --reload
uv run python manage.py check        # must pass before a PR
uv run ruff check . && uv run ruff format --check .   # ruff is a pinned dev dep; config in pyproject.toml

# Frontend → http://localhost:5173  (Vite proxies /api and /ws to :8000)
cd frontend && npm install
npm run dev
npm run lint                          # oxlint
npm run build                         # tsc -b + vite build; must pass before a PR
```

In Cursor/VS Code: Run and Debug → **"CrowdPlay: backend + frontend"** (`.vscode/launch.json`) starts both and frees ports 8000/5173 first.

Health check: `curl localhost:8000/api/health/` → `{"api":"ok","redis":"ok"}`.

## Git workflow — every change is its own PR

- **Never commit to `main` directly.** Branch from an up-to-date `main` for each change: `git switch main && git pull && git switch -c <type>/<short-name>`.
- **One concern per PR.** A feature, a fix, a refactor and a docs change are separate PRs. Don't mix drive-by refactors into feature PRs — open a follow-up instead.
- **Branch names:** `feat/`, `fix/`, `refactor/`, `docs/`, `chore/` + kebab-case, e.g. `feat/create-party`, `fix/ws-strictmode-close`.
- **Commits:** Conventional Commits — `feat(backend): add create party endpoint (F1–F3)`, `fix(frontend): ...`, `docs: ...`.
- **Before opening a PR:** backend `manage.py check` + ruff pass, frontend `lint` + `build` pass, and you've exercised the change locally (both servers running).
- **Open with `gh pr create`.** Description: what and why, PRD IDs covered, how it was tested, and anything a reviewer should look at. Keep PRs small enough to review in one sitting.
- Rebase on `main` before merging if it moved; resolve conflicts on the branch, not on `main`.

## Code structure

Keep this layout; put new code where it belongs rather than growing one file. When the structure changes, update this section in the same PR.

### Backend (`backend/`)

```
config/          settings.py (all config from env vars), asgi.py (HTTP + WebSocket routing), urls.py
core/            cross-cutting endpoints (health)
<domain app>/    one Django app per domain, e.g. parties/
  store.py       the ONLY module that talks to Redis for this domain (keys, TTLs, Lua/pipelines)
  services.py    business rules: sort order, limits, host checks — pure functions where possible
  events.py      WebSocket event names + payload shapes (single source on the backend)
  serializers.py DRF request/response validation
  views.py       REST endpoints — thin: validate → call services → respond
  consumers.py   Channels consumers — thin: parse → call services → broadcast
  routing.py / urls.py
  tests/
```

- Views and consumers stay thin; rules from the PRD (sort order, limits, auto-remove, host-only actions) live in `services.py` and are unit-tested.
- Every Redis key follows the PRD layout (`party:{code}`, `party:{code}:queue`, …) and gets a TTL — define key builders once in `store.py`.
- The server is the source of truth: clients send intents, the server validates, applies, then broadcasts. Never relay client payloads unvalidated (the current reaction relay in `core/consumers.py` is a demo and should move into the parties app with validation).
- New env vars: read in `settings.py`, add to `backend/.env.example`, document in `README.md` (Railway section) — same PR.
- Python style: ruff with the project config in `pyproject.toml` (never rely on a globally installed ruff — its defaults change between versions), type hints on public functions, async in consumers.

### Frontend (`frontend/src/`)

```
pages/        one component per route: Home, PartyScreen (/p/{code}, host), GuestView
components/   reusable UI pieces (StatusPill, QueueItem, ...)
hooks/        stateful logic, e.g. useParty(code) owning the WebSocket + snapshot/versioning
lib/api.ts    every HTTP and WebSocket URL goes through here (respects VITE_API_URL)
types/        API + event types — mirror backend events.py / serializers exactly
```

- `App.tsx` currently holds the whole home page; split it into `pages/` and `components/` before adding new screens.
- No hard-coded backend URLs outside `lib/api.ts`.
- WebSocket effects must detach handlers in cleanup (StrictMode mounts twice in dev; a stale socket's `onclose` otherwise overwrites live state).

## Keep things in sync

A PR that changes one side of a contract changes all of these together:

| If you change… | Also update, in the same PR |
|---|---|
| A WebSocket event or REST endpoint | backend `events.py`/serializers **and** frontend `types/` + callers, and the PRD's event/endpoint tables (doc first, then `PRD.md`) |
| A Redis key or its shape | `store.py` and the PRD data-model table |
| An env var | `settings.py`, `.env.example`, README deploy section |
| Commands, ports, layout, tooling | this file, README, `.vscode/launch.json` if affected |
| A product rule (limits, sort order) | `services.py` + its tests, PRD rules section |

Event and field names must match the PRD exactly (`snapshot`, `queueUpdated`, `nowPlaying`, `vote`, …).

## Gotchas

- WebSocket connections are origin-checked (`config/asgi.py`): allowed = `CORS_ALLOWED_ORIGINS` + `DJANGO_ALLOWED_HOSTS`. Testing from a phone on the LAN needs its origin added to both and `npm run dev -- --host`.
- The backend's `/` returns 404 by design; everything is under `/api/` or `/ws/`.
- DRF runs without the auth app (`DEFAULT_AUTHENTICATION_CLASSES: []`). Host/guest identity comes from the host token and device ID (F3, F4), never from Django users.

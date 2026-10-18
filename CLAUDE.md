# CLAUDE.md

This file gives Claude Code guidance for working in this repository.

## Project
- Remote: https://github.com/Nk095291/crowdplay.git
- Default branch: `main`
- Product spec: `PRD.md` (what we plan to build)
- Backend docs: `backend/docs/` (what is actually built)

## Backend docs — read first, update always

Before changing anything in `backend/`:

1. Read `backend/docs/README.md`, then every doc relevant to the change.
2. Make the code change.
3. Update the affected docs **in the same commit**. Code that leaves a doc
   wrong is not done.
4. Log non-obvious choices (adding/removing a dependency, changing a data
   shape or key name, dropping a feature) in `backend/docs/decisions.md`,
   newest first, dated.

Docs describe what exists. Anything not yet built is marked *Planned* and
links to the PRD.

### `backend/docs/` structure

| File | Covers |
|---|---|
| `README.md` | Index, folder structure, doc-keeping rules |
| `architecture.md` | Stack, code layout, request flow, built vs. planned |
| `api.md` | Every HTTP endpoint: method, path, request, response, status codes |
| `redis.md` | Redis connection, current usage, key model |
| `configuration.md` | Every env var and the setting it drives |
| `local-development.md` | Running, debugging, checking locally |
| `deployment.md` | Railway setup, start command, healthcheck |
| `decisions.md` | Dated decision log, newest first |

Add a new file only when a topic doesn't fit an existing one (e.g.
`websockets.md`), and add it to this table and to `backend/docs/README.md`.

## Commands

Backend (run from `backend/`):
- Install: `uv sync`
- Run: `uv run uvicorn config.asgi:application --port 8000 --reload`
- Check: `uv run python manage.py check`
- Health: `curl localhost:8000/api/health/`

## Conventions

- Keep this file current as the project's structure, tooling and conventions take shape.

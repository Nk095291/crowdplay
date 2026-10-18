# Local development

## Prereqs

- `uv` (installs Python 3.13 from `.python-version`)
- Redis running on `localhost:6379` (macOS: `brew services start redis`)

## Run

```bash
cd backend
cp .env.example .env
uv sync
uv run uvicorn config.asgi:application --port 8000 --reload
```

VS Code: Run & Debug → "Backend (Django · :8000)" (or the
"CrowdPlay: backend + frontend" compound) in `.vscode/launch.json`.

## Check

```bash
uv run python manage.py check          # settings/config sanity
curl localhost:8000/api/health/        # → {"api":"ok","redis":"ok"}
```

A `503` with `"redis":"error"` means Redis isn't running or `REDIS_URL` is
wrong.

## Dependencies

Add/remove with `uv add <pkg>` / `uv remove <pkg>`; commit both
`pyproject.toml` and `uv.lock`.

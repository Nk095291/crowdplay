# Backend docs

The source of truth for how the CrowdPlay backend works **today**. The product
spec (what we plan to build) lives in [`/PRD.md`](../../PRD.md); these docs
describe what is actually in the code.

## Structure

| File | Covers |
|---|---|
| [README.md](README.md) | This index, the folder structure and the rules for keeping docs current |
| [architecture.md](architecture.md) | Stack, code layout, how a request flows, what is built vs. planned |
| [api.md](api.md) | Every HTTP endpoint: method, path, request, response, status codes |
| [redis.md](redis.md) | Redis connection, how it is used now, and the key model |
| [configuration.md](configuration.md) | Every environment variable and the settings it drives |
| [local-development.md](local-development.md) | Running, debugging and checking the backend locally |
| [deployment.md](deployment.md) | Railway setup, start command, healthcheck |
| [decisions.md](decisions.md) | Decision log: what we chose, why, and when (newest first) |

New topics get their own file only when they don't fit an existing one (for
example `websockets.md` once real-time comes back). Add any new file to the
table above.

## Keeping docs current

- Read the relevant files here **before** changing backend code.
- Update them **in the same commit** as the code change. A change that makes a
  doc wrong without fixing it is incomplete.
- Describe what exists, not what is planned. Planned work is marked
  explicitly as *Planned* and links to the PRD section.
- Non-obvious choices (adding/removing a dependency, changing a data shape,
  dropping a feature) get an entry in [decisions.md](decisions.md).

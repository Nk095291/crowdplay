# Redis

Redis is the only data store. There is no SQL database.

## Connection

One URL, `REDIS_URL` (`config/settings.py`):

- Local default: `redis://localhost:6379/0`
- Railway: `${{Redis.REDIS_URL}}` (the managed Redis service)

It is wired into Django's cache framework through `django-redis`:

```python
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
    }
}
```

## How to talk to Redis

- **Simple get/set with TTL:** `from django.core.cache import cache`.
  Values are pickled and keys get Django's cache prefix/version, so these keys
  are only readable through the cache API.
- **Native structures (hashes, sorted sets, lists):** use the raw client,
  `from django_redis import get_redis_connection; r = get_redis_connection("default")`.
  The party-state model below needs this, since the cache API can't do sorted
  sets or hashes.

## Current usage

| Key | Via | Purpose |
|---|---|---|
| `healthcheck` | cache API, 5 s TTL | `GET /api/health/` round-trip probe |

Nothing else reads or writes Redis yet.

## Planned key model

*Planned* — from PRD "Data model". Not implemented. All keys expire 12 h after
the last activity.

| Key | Type | Holds |
|---|---|---|
| `party:{code}` | Hash | name, hostTokenHash, mode, vibe, theme, nowPlayingId, status, createdAt |
| `party:{code}:songs` | Hash | songId → JSON of videoId, title, channel, thumb, durationSec, genre, addedBy, addedAt |
| `party:{code}:queue` | Sorted set | songId by combined sort key: pin, then score, then time added |
| `party:{code}:votes:{songId}` | Hash | deviceId → +1 or −1 |
| `party:{code}:members` | Hash | deviceId → nickname, lastSeen |
| `party:{code}:comments` | List (last 100) | JSON of id, deviceId, nickname, text, at |
| `party:{code}:history` | List | songIds already played, for the duplicate check |

When this is built, move the rows into **Current usage** and keep this doc as
the source of truth for key names and shapes.

Real-time fan-out across server instances (Redis pub/sub, previously via the
Channels Redis layer) is also planned; see [decisions.md](decisions.md).

# CrowdPlay — Product Requirements Document

| | |
|---|---|
| **Status** | Draft v0.1 |
| **Last updated** | 2026-10-18 |
| **Team** | 2 engineers |
| **Stack** | React (Vite + TS) · Django + DRF + Channels · Redis · Postgres · Railway |

---

## 1. Overview

CrowdPlay is a shared party queue. A host starts a **room** on the device connected to the speakers; guests join from their phones with a short **room code** or **QR**, add songs, and **vote**. The queue reorders in real time, so the music reflects the room — not whoever holds the aux.

## 2. Problem

- At parties, trips and hangouts, one person controls the music and everyone else shouts requests.
- Passing a phone around is awkward and the queue becomes first-come-first-served, not best-first.
- Existing "collaborative playlists" have no voting, no live ordering and need everyone to have the same app/account.

## 3. Goals & non-goals

**Goals (MVP)**
1. A guest can join a room in **under 10 seconds** — no app install, no sign-up.
2. The queue updates for every participant in **< 500 ms** after a vote or add.
3. The host never loses control: skip, remove, lock the room.

**Non-goals (for now)**
- Hosting or streaming audio ourselves.
- Social features (profiles, followers, chat).
- Native mobile apps.

## 4. Users

| Persona | Need |
|---|---|
| **Host** | Runs the room on a laptop/TV. Wants great music with zero babysitting, and a kill switch for bad picks. |
| **Guest** | On their phone at the party. Wants to add *their* song and see it climb. Won't install anything. |

## 5. User stories

**Host**
- H1. As a host, I can create a room and see a large room code + QR to put on screen.
- H2. As a host, I can connect a music source so the top-voted track plays next.
- H3. As a host, I can skip the current song, remove a track, or ban a guest.
- H4. As a host, I can lock the room (no new adds) or close it.

**Guest**
- G1. As a guest, I can join by code/QR and pick a display name — no account.
- G2. As a guest, I can search for a song and add it to the queue.
- G3. As a guest, I can upvote / downvote tracks (one vote per track).
- G4. As a guest, I can see what's playing now and the live-ordered queue.
- G5. As a guest, I can send a quick reaction (🔥 🙌 💃 🎉) that shows on the host screen.

## 6. Scope

### MVP — "build it in a day"
- [x] Home page: start room / join by code; live backend status
- [x] Real-time room channel over WebSockets (Redis channel layer)
- [x] Live reactions demo
- [ ] Room model: create, join, close; 5-char codes (no ambiguous `0/O/1/I`)
- [ ] Guest session (anonymous, display name, cookie/token)
- [ ] Add track (search provider — see §10) and vote
- [ ] Live queue ordered by score; now-playing card
- [ ] Host controls: skip, remove, lock
- [ ] Host screen with QR code
- [ ] Deploy backend + Redis + Postgres to Railway

### Later
- Playback control via Spotify / YouTube (auto-advance to the top track)
- Vote cooldowns and per-guest add limits
- "Vibe guard": AI flags tracks that don't fit the room's mood
- Room history / export as playlist
- Spectator / TV mode with big visuals

## 7. Functional requirements

### 7.1 Rooms
- Code: 5 chars from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, unique among active rooms.
- A room expires **12 h** after its last activity.
- Only the host (holder of the host token issued on create) can use host controls.

### 7.2 Queue & voting
- Each guest has **one vote per track**: +1, −1 or none; changing a vote replaces it.
- Score = upvotes − downvotes. Order: score desc, then time added asc.
- A track hitting **score ≤ −3** is auto-removed.
- The same song can't be in the queue twice (dedupe by provider track id).
- Per guest: max **3 tracks queued** at once (configurable by host).

### 7.3 Real-time events (WebSocket `ws/rooms/{code}/`)

| Event | Direction | Payload |
|---|---|---|
| `reaction` | client → room | `{ emoji }` |
| `track.added` | server → room | `{ track }` |
| `vote.updated` | server → room | `{ track_id, score }` |
| `queue.snapshot` | server → client | `{ now_playing, queue[] }` — sent on connect |
| `track.removed` | server → room | `{ track_id, reason }` |
| `room.closed` | server → room | `{}` |

Clients send state changes over REST (validated, persisted); the server broadcasts the result over the socket. The socket is only trusted for ephemeral events (reactions).

### 7.4 REST API (draft)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health/` | API / DB / Redis status ✅ |
| POST | `/api/rooms/` | Create room → `{ code, host_token }` |
| GET | `/api/rooms/{code}/` | Room + queue snapshot |
| POST | `/api/rooms/{code}/join/` | `{ name }` → guest token |
| POST | `/api/rooms/{code}/tracks/` | Add a track |
| POST | `/api/rooms/{code}/tracks/{id}/vote/` | `{ value: 1 \| -1 \| 0 }` |
| POST | `/api/rooms/{code}/skip/` | Host only |
| DELETE | `/api/rooms/{code}/tracks/{id}/` | Host only |

## 8. Architecture

```
 Phone / Laptop (React, Vite)
        │  HTTPS (REST)          WSS (live events)
        ▼                         ▼
 ┌──────────────── Django (ASGI, uvicorn) ────────────────┐
 │  DRF views  ── write ──►  Postgres (rooms, tracks,     │
 │                            guests, votes)              │
 │  Channels consumers ◄──► Redis (channel layer:         │
 │                            room fan-out; cache)        │
 └────────────────────────────────────────────────────────┘
                     all on Railway
```

- **Postgres** is the source of truth. **Redis** is for fan-out between server instances and caching the hot queue — losing Redis must not lose data.
- Locally: Postgres/Redis from Homebrew (`brew services`); SQLite works if `DATABASE_URL` is unset.

### Data model (draft)

- `Room(id, code, host_token_hash, locked, created_at, last_active_at, closed_at)`
- `Guest(id, room, name, token_hash, banned, created_at)`
- `Track(id, room, provider, provider_id, title, artist, artwork_url, added_by→Guest, status[queued|playing|played|removed], added_at)`
- `Vote(guest, track, value)` — unique `(guest, track)`

## 9. Non-functional requirements

| Area | Target |
|---|---|
| Latency | Vote → all clients updated < 500 ms (p95) |
| Scale (MVP) | 50 guests per room, 20 concurrent rooms |
| Mobile | Guest UI fully usable at 360 px width |
| Security | Host/guest tokens hashed at rest; WebSocket origin check; rate limit adds/votes |
| Privacy | No accounts; only display name stored; rooms purged after expiry |

## 10. Risks & open questions

| # | Item | Notes |
|---|---|---|
| R1 | **Music source** | Spotify Web API gives great search, but playback control needs the host to have Premium and the app is limited in dev mode. YouTube is free but embed playback is less controllable. **Decision needed** before story H2. |
| R2 | Vote spam | Anonymous guests can rejoin to vote again. MVP: token per device + rate limit; later: device fingerprint. |
| R3 | Host disconnects | Room must survive host refresh — host token in local storage. |
| Q1 | Do downvotes exist, or only upvotes? | Downvotes help remove bad picks but can feel negative. |
| Q2 | Can guests skip by vote (e.g. 50% of guests)? | Nice feature; adds complexity. |

## 11. Success metrics

- Time from QR scan to first vote **< 15 s** (median).
- **≥ 60 %** of guests in a room add or vote at least once.
- Rooms lasting **> 30 min** (proxy for "it actually got used at the party").

## 12. One-day build plan

| Time | Dev A (backend) | Dev B (frontend) |
|---|---|---|
| 09:00–10:00 | Together: lock API + event contracts (§7.3–7.4) | ← |
| 10:00–13:00 | Models, room/join/track/vote endpoints, broadcasts | Room page, join flow, queue list with live updates |
| 13:00 | **Checkpoint: two phones voting, queue reorders live** | ← |
| 14:00–17:00 | Host controls, rate limits, music search proxy | Host screen + QR, search UI, reactions, polish |
| 17:00–18:00 | Railway deploy (backend, Redis, Postgres) | Frontend deploy, env wiring |
| 18:00 | Demo 🎉 | |

**Cut list if behind:** downvotes → host ban → search (paste a link instead) → reactions.

# Room DJ — PRD

2026-10-18 · Mehak Dhingra

> **Source of truth:** [Room DJ — PRD](https://claude.ai/artifact/BTNbsTd7UZEDKozjdF3K1C). This file is a Markdown copy for the repo; if they differ, the doc wins — update the doc first, then this file.

## Overview

Room DJ is a shared party queue. The host opens one screen that plays YouTube songs through the speakers, and guests scan a QR code to add songs, vote and comment from their phones, with no login.

**Problem.** At a party, one person controls the music. Everyone else either crowds around one phone or doesn't get a say, and the vibe drifts.

**Vision.** The crowd shapes the queue together, and later an AI DJ reads the room: it reorders by mood, themes the screen to match, and reacts to what people say.

**Goals for the first release (non-AI)**

- A host creates a party in one tap and gets a shareable link and QR code.
- Guests join in under 10 seconds: scan, pick a nickname, done.
- Everyone sees the same queue, updated live within 1 second of any change.
- Votes reorder the queue in a predictable, explainable way.
- The host stays in control: skip, remove, pin, end.

**Non-goals for now**

- All AI features: mood sorting, mood themes, AI comment picks and DJ commentary. These are scoped in *AI features (later)*.
- Spotify, Apple Music, or audio sources other than YouTube.
- Playing music on every guest's phone in sync.
- Accounts, party history, or a native mobile app.

## Users and roles

There are three roles: one host and many guests, plus the party screen, which is a view rather than a person.

| Role | Who | Device | Can do |
|---|---|---|---|
| Host | Person who created the party | Laptop or TV, plus their phone | Everything a guest can, plus skip, remove, pin next, switch sort mode, lock the queue, end the party |
| Guest | Anyone with the link or QR | Their phone | Add songs, vote up or down, comment, see the queue live |
| Party screen | Big-screen view, run by the host | Laptop connected to speakers or TV | Plays the current song, shows the queue, QR code and mood board (from the sketch) |

Host rights come from a secret host token stored on the host's device when they create the party. Anyone holding the host link can act as host, so the host can share it with a co-host.

## Core user flows

Five flows make up the MVP. Each one should take a first-time user less than 15 seconds.

**1. Create a party (host)**

1. Host opens the home page and taps **Create Party**.
2. Optionally enters a party name; otherwise a fun default is generated, e.g. "Saturday Night".
3. Lands on the party screen at `/p/{code}`, where `code` is 6 characters such as `abcdef`, with the QR code shown.
4. The browser stores the host token, and a "Copy host link" option is available for a co-host.

**2. Join a party (guest)**

1. Guest scans the QR code or opens the link.
2. Enters a nickname, which is remembered on that device.
3. Sees the mobile guest view: now playing, the queue, add song, comment.

**3. Add a song**

1. Guest pastes a YouTube link (`youtube.com/watch`, `youtu.be`, `music.youtube.com`, or Shorts).
2. The app fetches the title, channel, thumbnail and duration, and checks the video can be embedded.
3. Guest picks a genre tag from a short list. This is optional and can be skipped.
4. The song joins the queue for everyone, with the guest's name shown.
5. Errors are clear: invalid link, video can't be embedded, already in the queue, or song limit reached.

**4. Vote**

1. Guest taps up or down on any song that isn't playing.
2. Tapping the same arrow again removes the vote; tapping the other arrow switches it.
3. The queue re-sorts for everyone, with a smooth reorder animation.

**5. Playback (party screen)**

1. The host presses **Start** once, because browsers block autoplay until someone interacts with the page.
2. The top song plays in the embedded YouTube player.
3. When it ends, or the host skips it, the next top song starts automatically.
4. When the queue is empty, the screen shows "Queue's empty — add a song!" next to the QR code.

## Functional requirements (non-AI MVP)

P0 items must ship in the first release; P1 items are next if there is time.

| ID | Area | Requirement | Priority |
|---|---|---|---|
| F1 | Home | Home page with a **Create Party** button and an optional party name | P0 |
| F2 | Party | Unique 6-character party code and URL `/p/{code}`; QR code of the guest URL on the party screen | P0 |
| F3 | Party | Host token created on party creation; host-only actions are checked on the server | P0 |
| F4 | Join | Nickname prompt on first visit, plus a device ID stored in localStorage | P0 |
| F5 | Songs | Add a song by YouTube link; check it's valid and embeddable; store video ID, title, channel, thumbnail and duration | P0 |
| F6 | Queue | Shared queue showing thumbnail, title, who added it, score and your own vote | P0 |
| F7 | Votes | Up and down votes, one per device per song; toggle or switch | P0 |
| F8 | Realtime | Every queue, vote, playback and comment change reaches all clients within 1 second | P0 |
| F9 | Playback | Embedded YouTube player on the party screen; plays the top song, moves on when it ends | P0 |
| F10 | Host | Host controls: play/pause, skip, remove song, end party | P0 |
| F11 | Layout | Party screen layout as in the sketch (mood board, queue, QR); mobile-first guest view | P0 |
| F12 | Comments | Guests post short comments (max 140 characters) shown in a live feed on the mood board | P0 |
| F13 | Mood board | Host sets the vibe text (e.g. "Dil thoda romantic") and picks one of about 6 preset themes by hand | P1 |
| F14 | Sorting | Genre tag when adding a song; host-only "Group by genre" toggle | P1 |
| F15 | Host | Pin a song to play next; lock the queue (no new songs) | P1 |
| F16 | Reconnect | Clients reconnect on their own and catch up to the current state after a network drop | P1 |
| F17 | Share | "Copy link" button and native share sheet on the guest view | P1 |

## Rules: voting, sorting, limits, host controls

The queue order is deterministic: anyone looking at the votes can tell why a song sits where it does.

**Sort order (Crowd mode, the default)**

1. A song the host has pinned always comes first.
2. Then by score, highest first; score = upvotes − downvotes.
3. Ties go to whichever was added earlier.
4. If the host has turned on **Group by genre** (P1), then within a tie, songs with the same genre as the one playing come first. Votes always outrank genre.

The song that's playing is locked: it can't be voted on, moved or removed except by the host skipping it.

**Limits**

| Rule | Default | Why |
|---|---|---|
| Songs in the queue per guest | 3 at a time | Stops one person flooding the queue |
| Duplicate songs | Blocked while the song is queued or played in the last 60 minutes | Avoids repeats |
| Max song length | 10 minutes (host can override) | Stops hour-long mixes |
| Auto-remove | Score of −3 or lower, with at least 3 voters | The crowd can veto a song without the host |
| Comment length | 140 characters | Keeps the mood board readable |
| Comment rate | 1 per 10 seconds per device | Stops spam |
| Party expiry | 12 hours after the last activity | Cleans up storage |

**Host controls**

- Play / pause, skip, remove any song, remove any comment.
- Pin a song to play next (P1).
- Lock the queue so no new songs can be added (P1).
- Switch sort mode: Crowd now, AI DJ later.
- End party: everyone sees a "Party's over" screen and the data is deleted.

## Technical design

> **Implementation note (repo):** we're building the backend with **Django + Django Channels** (ASGI on uvicorn) instead of FastAPI. Everything else here still applies: Redis holds party state and fans events out across instances (Channels' Redis channel layer does the pub/sub), the server is the source of truth, REST for create/join/add song, WebSocket for everything live.

The backend is a single Python (FastAPI) server holding WebSocket connections, with Redis for all party state and a React frontend. The server is the source of truth: clients send what they want to do, and the server checks it, applies it and sends the result to everyone.

**Stack**

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React + Vite + TypeScript, Tailwind | Two views: party screen and guest view |
| Realtime | WebSocket (FastAPI's built-in support) | One connection per client at `/ws/{code}` |
| Backend | Python 3.13, FastAPI, Uvicorn, Pydantic, `redis-py` (asyncio); managed with `uv` | REST for create/join/add song; WebSocket for everything live |
| State | Redis | Sorted sets for the queue, pub/sub to send events across server instances, a TTL on every key |
| Playback | YouTube IFrame Player API | Runs only on the party screen |
| Metadata | YouTube Data API v3 `videos.list` | Title, channel, thumbnail, duration and `status.embeddable`; 1 quota unit per call out of 10,000 a day free |
| QR | `qrcode.react` | Generated in the browser from the guest URL |
| Hosting | Fly.io or Railway (Python + Redis), Vercel (frontend) | Needs a public URL so guests on mobile data can join |

**Data model (Redis, all keys expire 12 h after the last activity)**

| Key | Type | Holds |
|---|---|---|
| `party:{code}` | Hash | name, hostTokenHash, mode, vibe, theme, nowPlayingId, status, createdAt |
| `party:{code}:songs` | Hash | songId → JSON of videoId, title, channel, thumb, durationSec, genre, addedBy, addedAt |
| `party:{code}:queue` | Sorted set | songId by a combined sort key: pin, then score, then time added |
| `party:{code}:votes:{songId}` | Hash | deviceId → +1 or −1 |
| `party:{code}:members` | Hash | deviceId → nickname, lastSeen |
| `party:{code}:comments` | List (last 100) | JSON of id, deviceId, nickname, text, at |
| `party:{code}:history` | List | songIds already played, for the duplicate check |

**Realtime events.** On connect, the server sends a full `snapshot`. After that it sends small events, each with a version number that goes up by one. A client that notices a gap in the numbers asks for a fresh snapshot.

| Direction | Event | Payload |
|---|---|---|
| Client → server | `vote` | songId, value (+1, −1, 0) |
| Client → server | `comment` | text |
| Host → server | `skip` / `remove` / `pin` / `play` / `pause` / `setVibe` / `endParty` | target IDs and values |
| Party screen → server | `songEnded` / `songError` | songId, YouTube error code |
| Server → all | `snapshot` / `queueUpdated` / `nowPlaying` / `commentAdded` / `vibeChanged` / `partyEnded` | new state with its version number |

Adding a song goes through REST (`POST /api/parties/{code}/songs`), because it calls YouTube and can fail with a readable error. The server then broadcasts `queueUpdated`.

**YouTube gotchas to design for**

- Some videos block embedding: check `status.embeddable` when the song is added, and skip automatically on player errors `101` and `150`.
- Browsers block autoplay until the user interacts, so the party screen needs one **Start** click; after that, songs move on automatically.
- Ads may play on some videos. That's acceptable; just don't treat an ad as the song ending.
- Keep the API key on the server only, and cache metadata by videoId.

## Phased roadmap

Phases 0 and 1 make up the build day. Phase 2 makes the app reliable enough for a real party, and AI work starts only once that gate passes.

> *Roadmap diagram (5 phases, 4 gates) lives in the [source doc](https://claude.ai/artifact/BTNbsTd7UZEDKozjdF3K1C).*

Each gate is a test you can run; don't start the next phase until it passes.

**Build-day checklist (Phases 0–1)**

- [ ] Agree on the event names and payloads in *Technical design* before splitting up
- [ ] Repo, Docker Compose (Redis), FastAPI server skeleton, Vite + React skeleton
- [ ] Deploy both to public URLs; WebSocket echo works between two phones
- [ ] Create party + host token + QR code (F1–F3)
- [ ] Join with nickname + device ID (F4)
- [ ] Add a song via YouTube link, with metadata and embeddable check (F5)
- [ ] Live queue + votes + sort order (F6–F8)
- [ ] Party screen player that moves to the next song on its own (F9)
- [ ] Host controls (F10)
- [ ] Party screen and guest layouts (F11)
- [ ] Comment feed on the mood board (F12)
- [ ] Log skips, votes and host overrides, for the AI baseline later (D14)
- [ ] Gate 1 test: 3 phones + party screen for 30 minutes

## AI features (later) and decisions to make

The AI work comes after the non-AI MVP, in Phases 3 and 4. It plugs into the MVP through three hooks that already exist: the sort mode switch, the mood board's vibe and theme fields, and the comment feed. None of these AI features needs the MVP to be rebuilt.

**Planned AI features**

| Feature | What it does | Phase |
|---|---|---|
| Song understanding | Tags each song with genre, mood and energy (1–5) when it's added; cached by videoId. Also fills in the genre tag automatically | 3 |
| AI DJ sort mode | Second sort mode the host can switch to: the AI orders songs by vibe and energy flow, with votes as guardrails | 3 |
| Vibe detection | Works out the room's current vibe from what's playing, the queue and recent comments; writes the mood board text (e.g. "Dil thoda romantic") | 3 |
| Mood themes | Changes the party screen's colors, background and animation to match the vibe, when each song starts | 3 |
| Comment picks | Picks the most interesting comments and features them on the mood board | 4 |
| DJ commentary | A virtual DJ reacts to featured comments and introduces songs | 4 |
| AI moderation | Hides abusive comments and flags inappropriate song titles | 4 |

**Decisions to make before or during AI work**

The Status column shows where each decision stands. "Leaning" means there's a recommendation but nothing is locked.

| # | Decision | Options | Current leaning | Decide by | Status |
|---|---|---|---|---|---|
| D1 | Where the AI runs | Local Ollama; cloud API (e.g. Claude Haiku); both behind one interface | Both behind one interface: Ollama in development, cloud in production (guests can join from anywhere) | Start of Phase 3 | Leaning |
| D2 | How we understand a song | LLM reads title + channel + YouTube tags; lyrics lookup; audio analysis | LLM on the title, channel and tags; cache the result by videoId | Start of Phase 3 | Leaning |
| D3 | Mood vocabulary | Fixed list (romantic, party, chill, sad, hype, sufi, retro…) vs free text | Fixed list of about 8 moods, plus energy 1–5, plus a free-text vibe line for display | Start of Phase 3 | Open |
| D4 | How votes and vibe combine in AI DJ mode | AI reorders freely; votes as guardrails; AI only breaks ties | Votes as guardrails: a song with 3+ more votes can never be placed below one with fewer | Phase 3 | Open |
| D5 | Who sets the vibe | Host only; AI only; AI with host override | AI suggests, host can override or pin the vibe | Phase 3 | Open |
| D6 | How themes work | AI picks from preset themes; AI generates colors | Preset themes (reuse F13), AI chooses one; change only at song boundaries | Phase 3 | Leaning |
| D7 | What makes a comment "interesting" | Funny, a song request, a shout-out, about the current song; how many get featured per song | Rules to be written with examples; at most 2 featured per song; batch every 20–30 s | Start of Phase 4 | Open |
| D8 | DJ persona and language | Name, tone, Hinglish vs English, how cheeky it gets | Playful Hinglish persona; never mocks a guest by name | Start of Phase 4 | Leaning |
| D9 | How the DJ speaks | Text on mood board; browser text-to-speech; cloud TTS with music lowered | Text first; voice as an add-on later | Phase 4 | Open |
| D10 | Moderation policy | Hide vs block; who sees hidden comments; also screen song titles? | AI hides and the host can restore | Phase 4 | Open |
| D11 | Explaining AI choices | Show "why it's next" on each song, or not | Small reason chip, e.g. "keeps the romantic run going" | Phase 3 | Open |
| D12 | Cost and failure handling | Spend cap per party; rate of AI calls; what happens when the AI is down | Cap AI calls per party; fall back to Crowd mode quietly | Start of Phase 3 | Open |
| D13 | Privacy | Telling guests their comments go to an AI provider; how long data is kept | One-line notice on the join screen; no data kept after the party ends | Start of Phase 3 | Open |
| D14 | How we measure AI DJ quality | Skip rate, how often the host overrides, downvote rate in AI mode vs Crowd mode | Log these from Phase 1 so there's a baseline to compare against | Phase 1 (logging) | Open |

## Risks, open questions, success metrics

The biggest risk is YouTube playback behavior, not our own code, so test it on day one with real links.

**Risks**

| Risk | Impact | Mitigation |
|---|---|---|
| Many music videos (especially label-owned Bollywood) block embedding | Songs fail to play | Check `status.embeddable` when added; skip automatically on errors 101/150; suggest the "lyrics" or "audio" version |
| Autoplay is blocked or the party screen tab goes to sleep | Music stops | One Start click; keep the screen awake (Wake Lock API); show a big "Tap to resume" overlay |
| YouTube API quota (10,000 units a day) | Can't add songs | Cache by videoId; 1 unit per lookup covers about 10,000 songs a day |
| Guests spam songs or votes | Unfair queue | Per-device limits; rate limits; host remove. A device ID can be reset, which is acceptable for a party |
| Host closes the party screen | Party stalls | State lives in Redis; reopening the host link picks up where it left off |
| WebSocket drops on mobile networks | Stale queue | Automatic reconnect with a fresh snapshot (F16) |
| YouTube terms of service | Takedown risk if public | Use only the official embedded player; never download or extract audio |

**Open questions (non-AI)**

- [ ] Should guests also be able to search YouTube by name instead of pasting a link? (Costs 100 quota units per search.)
- [ ] Is the genre tag picked by guests at all, or does it wait for the AI to fill it in?
- [ ] Should downvotes be visible as a number, or only the net score?
- [ ] Final party URL format: `/p/abcdef` or `/id/abcdefg` as in the sketch?
- [ ] Domain name and app name: is it "Room DJ"?

**Success metrics**

| Metric | Target for MVP |
|---|---|
| Time for a guest to join (scan to seeing the queue) | Under 10 s |
| Delay before a change reaches every client | Under 1 s at the 95th percentile (p95) |
| Songs that fail to play after being added | Under 5% |
| Guests at a party who add or vote at least once | Over 60% |
| Test party with 10+ real guests, start to finish | No refresh needed, no crashes |

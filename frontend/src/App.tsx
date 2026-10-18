import { useEffect, useRef, useState } from 'react'
import { fetchHealth, roomSocketUrl, type Health } from './lib/api'

type ConnState = 'idle' | 'connecting' | 'live' | 'closed'
type Reaction = { id: number; emoji: string; left: number }

const REACTIONS = ['🔥', '🙌', '💃', '🎉']

function makeRoomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
}

function StatusPill() {
  const [health, setHealth] = useState<Health | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const load = () =>
      fetchHealth()
        .then((h) => {
          setHealth(h)
          setFailed(false)
        })
        .catch(() => setFailed(true))
    load()
    const id = setInterval(load, 10_000)
    return () => clearInterval(id)
  }, [])

  const allOk = health && Object.values(health).every((v) => v === 'ok')
  const label = failed ? 'Backend offline' : !health ? 'Checking…' : allOk ? 'All systems live' : 'Degraded'
  const tone = failed ? 'bad' : !health ? 'wait' : allOk ? 'good' : 'warn'

  return (
    <div className={`pill pill--${tone}`} title={health ? JSON.stringify(health) : undefined}>
      <span className="pill__dot" />
      {label}
      {health && (
        <span className="pill__detail">
          API · DB · Redis
        </span>
      )}
    </div>
  )
}

function RoomPanel({ code, onLeave }: { code: string; onLeave: () => void }) {
  const [state, setState] = useState<ConnState>('connecting')
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [count, setCount] = useState(0)
  const socket = useRef<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket(roomSocketUrl(code))
    socket.current = ws
    ws.onopen = () => setState('live')
    ws.onclose = () => setState('closed')
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type !== 'reaction') return
      const r = { id: Date.now() + Math.random(), emoji: msg.emoji, left: 10 + Math.random() * 80 }
      setCount((c) => c + 1)
      setReactions((rs) => [...rs, r])
      setTimeout(() => setReactions((rs) => rs.filter((x) => x.id !== r.id)), 1800)
    }
    return () => ws.close()
  }, [code])

  const send = (emoji: string) => socket.current?.send(JSON.stringify({ type: 'reaction', emoji }))

  return (
    <div className="room">
      <div className="room__head">
        <div>
          <div className="room__label">Room code</div>
          <div className="room__code">{code}</div>
        </div>
        <span className={`room__state room__state--${state}`}>{state === 'live' ? '● Live' : state}</span>
      </div>
      <p className="room__hint">
        Open this page in another tab and join <strong>{code}</strong>. Reactions sync in real time
        through Redis.
      </p>
      <div className="room__stage">
        {reactions.map((r) => (
          <span key={r.id} className="float" style={{ left: `${r.left}%` }}>
            {r.emoji}
          </span>
        ))}
        <span className="room__count">{count} reactions</span>
      </div>
      <div className="room__reactions">
        {REACTIONS.map((e) => (
          <button key={e} onClick={() => send(e)} disabled={state !== 'live'} aria-label={`Send ${e}`}>
            {e}
          </button>
        ))}
      </div>
      <button className="link" onClick={onLeave}>
        Leave room
      </button>
    </div>
  )
}

export default function App() {
  const [room, setRoom] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState('')

  const join = (e: React.FormEvent) => {
    e.preventDefault()
    const code = joinCode.trim().toUpperCase()
    if (/^[A-Z0-9]{4,8}$/.test(code)) setRoom(code)
  }

  return (
    <div className="page">
      <nav className="nav">
        <a className="logo" href="/">
          <span className="logo__mark" aria-hidden>
            <i /><i /><i /><i />
          </span>
          CrowdPlay
        </a>
        <StatusPill />
      </nav>

      <main className="hero">
        <section className="hero__copy">
          <span className="eyebrow">Party mode for your speakers</span>
          <h1>
            The crowd picks <br />
            <span className="grad">the music.</span>
          </h1>
          <p className="lede">
            Start a room, put the QR code on the screen, and let everyone add songs and vote from their
            phones. The best tracks rise to the top, live.
          </p>

          {!room && (
            <div className="actions">
              <button className="btn btn--primary" onClick={() => setRoom(makeRoomCode())}>
                Start a room
              </button>
              <form className="join" onSubmit={join}>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter code"
                  maxLength={8}
                  aria-label="Room code"
                />
                <button className="btn" type="submit">
                  Join
                </button>
              </form>
            </div>
          )}
        </section>

        <section className="hero__side">
          {room ? (
            <RoomPanel code={room} onLeave={() => setRoom(null)} />
          ) : (
            <div className="queue" aria-label="Example queue">
              <div className="queue__title">Up next · Room RAVE7</div>
              {[
                ['Blinding Lights', 'The Weeknd', 42],
                ['Levitating', 'Dua Lipa', 31],
                ['Kesariya', 'Arijit Singh', 27],
                ['Mr. Brightside', 'The Killers', 18],
              ].map(([title, artist, votes], i) => (
                <div className="track" key={title as string}>
                  <span className="track__rank">{i + 1}</span>
                  <div className="track__meta">
                    <div className="track__title">{title}</div>
                    <div className="track__artist">{artist}</div>
                  </div>
                  <span className="track__votes">▲ {votes}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <section className="steps">
        {[
          ['01', 'Start a room', 'The host connects their music and gets a short room code and a QR.'],
          ['02', 'Everyone joins', 'Guests scan, no app or sign-up. Add songs from search in seconds.'],
          ['03', 'Vote it up', 'The queue reorders live. No more one person hogging the aux.'],
        ].map(([n, t, d]) => (
          <div className="step" key={n}>
            <span className="step__n">{n}</span>
            <h3>{t}</h3>
            <p>{d}</p>
          </div>
        ))}
      </section>

      <footer className="footer">CrowdPlay · built in a day</footer>
    </div>
  )
}

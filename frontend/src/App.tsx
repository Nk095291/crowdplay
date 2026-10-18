import { useEffect, useState } from 'react'
import { checkHealth } from './lib/api'

function StatusPill() {
  const [healthy, setHealthy] = useState<boolean | null>(null)

  useEffect(() => {
    checkHealth().then(setHealthy)
  }, [])

  const label = healthy === null ? 'Checking…' : healthy ? 'Backend live' : 'Backend offline'
  const tone = healthy === null ? 'wait' : healthy ? 'good' : 'bad'

  return (
    <div className={`pill pill--${tone}`}>
      <span className="pill__dot" />
      {label}
    </div>
  )
}

export default function App() {
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
        </section>

        <section className="hero__side">
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

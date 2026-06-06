"use client";

import { useState } from "react";

const BASE = "https://db.screenopps.com";

const QUICK_TESTS = [
  { type: "movie" as const, title: "Fight Club", id: "550" },
  { type: "movie" as const, title: "Inception", id: "27205" },
  { type: "tv" as const, title: "Breaking Bad", id: "1396", season: "1", episode: "1" },
  { type: "tv" as const, title: "Peaky Blinders", id: "94997", season: "2", episode: "3" },
];

export default function Home() {
  const [tab, setTab] = useState<"movie" | "tv">("movie");

  const [movieId, setMovieId] = useState("");
  const [tvId, setTvId] = useState("");
  const [season, setSeason] = useState("1");
  const [episode, setEpisode] = useState("1");

  const movieUrl = movieId ? `${BASE}/db/movie/${movieId}` : null;
  const tvUrl = tvId ? `${BASE}/db/tv/${tvId}/${season}/${episode}` : null;

  const handleQuickFill = (item: (typeof QUICK_TESTS)[number]) => {
    setTab(item.type);
    if (item.type === "movie") {
      setMovieId(item.id);
    } else {
      setTvId(item.id);
      setSeason(item.season!);
      setEpisode(item.episode!);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #0a0a0f;
          color: #e0e0f0;
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
        }

        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .card {
          width: 100%;
          max-width: 560px;
          background: #0f0f1a;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          padding: 40px 36px 44px;
        }

        /* Logo */
        .logo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 24px;
          letter-spacing: 0.08em;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .logo-dot { color: #e63946; }
        .tagline {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #3a3a5a;
          margin-bottom: 36px;
        }

        /* Tabs */
        .tabs {
          display: flex;
          gap: 0;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 28px;
          width: fit-content;
        }
        .tab-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 24px;
          border-radius: 7px;
          cursor: pointer;
          color: #4a4a6a;
          border: none;
          background: transparent;
          transition: all 0.15s;
          letter-spacing: 0.03em;
        }
        .tab-btn.active { background: #e63946; color: #fff; }
        .tab-btn:not(.active):hover { color: #c0c0e0; background: rgba(255,255,255,0.05); }

        /* Labels */
        .field-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #3a3a5a;
          margin-bottom: 8px;
        }

        /* Inputs */
        .input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          padding: 12px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #e0e0f4;
          outline: none;
          transition: border-color 0.15s;
          -moz-appearance: textfield;
        }
        .input::-webkit-outer-spin-button,
        .input::-webkit-inner-spin-button { -webkit-appearance: none; }
        .input::placeholder { color: #2e2e4e; }
        .input:focus { border-color: rgba(230,57,70,0.45); }

        .field-row {
          display: flex;
          gap: 10px;
        }
        .field-row > * { flex: 1; }

        /* URL preview */
        .url-preview {
          margin-top: 12px;
          padding: 11px 16px;
          background: rgba(255,255,255,0.02);
          border: 1px dashed rgba(255,255,255,0.07);
          border-radius: 8px;
          font-size: 12px;
          word-break: break-all;
          line-height: 1.6;
          min-height: 40px;
          display: flex;
          align-items: center;
        }
        .url-empty { color: #2e2e4a; font-style: italic; }
        .url-host { color: #44446a; }
        .url-path { color: #6868a8; }
        .url-id { color: #e63946; font-weight: 600; }

        /* Go button */
        .go-btn {
          margin-top: 16px;
          width: 100%;
          background: #e63946;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 13px 20px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: 0.02em;
        }
        .go-btn:hover:not(:disabled) { background: #c1121f; }
        .go-btn:disabled {
          background: rgba(230,57,70,0.12);
          color: rgba(230,57,70,0.3);
          cursor: not-allowed;
        }

        /* Divider */
        .divider {
          height: 1px;
          background: rgba(255,255,255,0.05);
          margin: 32px 0;
        }

        /* Quick tests */
        .quick-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #2e2e4a;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .quick-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.04);
        }

        .quick-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .quick-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.065);
          border-radius: 10px;
          padding: 14px 16px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          text-align: left;
          font-family: 'DM Sans', sans-serif;
          color: inherit;
          width: 100%;
        }
        .quick-card:hover {
          background: rgba(255,255,255,0.055);
          border-color: rgba(255,255,255,0.12);
        }
        .qc-badge {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 4px;
          display: inline-block;
          margin-bottom: 8px;
        }
        .qc-badge.movie { background: rgba(230,57,70,0.15); color: #e63946; }
        .qc-badge.tv    { background: rgba(100,130,255,0.15); color: #8899ff; }
        .qc-title {
          font-size: 13px;
          font-weight: 600;
          color: #c0c0e0;
          margin-bottom: 2px;
        }
        .qc-meta { font-size: 11px; color: #3a3a5a; font-family: monospace; }

        /* Footer */
        .footer {
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.04);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .footer-brand {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 12px;
          letter-spacing: 0.1em;
          color: #1e1e2e;
        }
        .footer-hint { font-size: 11px; color: #1e1e2e; }

        @media (max-width: 480px) {
          .card { padding: 28px 20px 32px; }
          .quick-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="page" suppressHydrationWarning>
        <div className="card" suppressHydrationWarning>

          {/* Logo */}
          <div className="logo">
            ↓ db<span className="logo-dot">.screenopps</span>.com
          </div>
          <div className="tagline">API endpoint tester</div>

          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab-btn ${tab === "movie" ? "active" : ""}`}
              onClick={() => setTab("movie")}
            >
              🎬 Movie
            </button>
            <button
              className={`tab-btn ${tab === "tv" ? "active" : ""}`}
              onClick={() => setTab("tv")}
            >
              📺 TV Episode
            </button>
          </div>

          {/* Movie */}
          {tab === "movie" && (
            <div>
              <div className="field-label">TMDB Movie ID</div>
              <input
                className="input"
                type="number"
                placeholder="e.g. 550, 27205, 787699"
                value={movieId}
                onChange={(e) => setMovieId(e.target.value)}
              />
              <div className="url-preview">
                {movieUrl ? (
                  <>
                    <span className="url-host">{BASE}</span>
                    <span className="url-path">/db/movie/</span>
                    <span className="url-id">{movieId}</span>
                  </>
                ) : (
                  <span className="url-empty">URL preview will appear here…</span>
                )}
              </div>
              <button
                className="go-btn"
                disabled={!movieUrl}
                onClick={() => movieUrl && window.open(movieUrl, "_blank")}
              >
                Open download page ↗
              </button>
            </div>
          )}

          {/* TV */}
          {tab === "tv" && (
            <div>
              <div className="field-label">TMDB Show ID</div>
              <input
                className="input"
                type="number"
                placeholder="e.g. 1396, 94997, 60625"
                value={tvId}
                onChange={(e) => setTvId(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <div className="field-row">
                <div>
                  <div className="field-label">Season</div>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                  />
                </div>
                <div>
                  <div className="field-label">Episode</div>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={episode}
                    onChange={(e) => setEpisode(e.target.value)}
                  />
                </div>
              </div>
              <div className="url-preview" style={{ marginTop: 12 }}>
                {tvUrl ? (
                  <>
                    <span className="url-host">{BASE}</span>
                    <span className="url-path">/db/tv/</span>
                    <span className="url-id">{tvId}</span>
                    <span className="url-path">/</span>
                    <span className="url-id">{season}</span>
                    <span className="url-path">/</span>
                    <span className="url-id">{episode}</span>
                  </>
                ) : (
                  <span className="url-empty">URL preview will appear here…</span>
                )}
              </div>
              <button
                className="go-btn"
                disabled={!tvUrl}
                onClick={() => tvUrl && window.open(tvUrl, "_blank")}
              >
                Open episode page ↗
              </button>
            </div>
          )}

          <div className="divider" />

          {/* Quick tests */}
          <div className="quick-label">Quick test IDs</div>
          <div className="quick-grid">
            {QUICK_TESTS.map((item, i) => (
              <button
                key={i}
                className="quick-card"
                onClick={() => handleQuickFill(item)}
              >
                <span className={`qc-badge ${item.type}`}>
                  {item.type === "movie" ? "Movie" : "TV"}
                </span>
                <div className="qc-title">{item.title}</div>
                <div className="qc-meta">
                  tmdb: {item.id}
                  {item.type === "tv" && ` · S${item.season}E${item.episode}`}
                </div>
              </button>
            ))}
          </div>

          <div className="footer">
            <div className="footer-brand">db.screenopps.com</div>
            <div className="footer-hint">Powered by TMDB IDs</div>
          </div>

        </div>
      </div>
    </>
  );
}
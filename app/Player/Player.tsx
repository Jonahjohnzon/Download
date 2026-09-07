/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState } from "react";
import Script from "next/script";
import { useSnapshot } from "valtio";
import { store } from "@/app/store";

type VideoSource = {
  quality: string; // e.g. "480p" — kept as `quality` to match qualityColor()
  label?: string;
  size?: string; // human-readable, e.g. "150 MB"
  url: string;
};

type Subtitle = {
  label: string;
  url: string;
};

function formatBytes(bytes?: number | string): string {
  const n = Number(bytes);
  if (!n || Number.isNaN(n)) return "Unknown";
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(0)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const norm = (s: string) => (s || "").trim().toLowerCase();

const Player = () => {
  const Store = useSnapshot(store);

  const title = Store.title;
  const backgroundposter = Store.poster;

  const paramId = Store.ParamId;
  const Type = Store.Type; // 'tv' | 'movie'
  const seasonParam = Store.Season;
  const episodeParam = Store.Episode;

  const [sources, setSources] = useState<VideoSource[]>([]);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!title || !paramId || !Type) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        // movie subjects use subjectType 1, tv/series use subjectType 2 —
        // same convention DScreen's RN matching uses.
        const expectedSubjectType = Type === "tv" ? 2 : 1;

        const soRes = await fetch(
          `https://api.screenopps.com/search?q=${encodeURIComponent(title)}`
        );
        const soData = await soRes.json();
        const items = soData?.items ?? [];

        const titleNorm = norm(title);
        // TV entries are frequently suffixed ("S1-S6", "[English]"), so a
        // startsWith check catches them; movies are usually the bare title.
        let candidates =
          Type === "tv"
            ? items.filter((it: any) => norm(it.name).startsWith(titleNorm))
            : items.filter((it: any) => norm(it.name) === titleNorm);
        if (!candidates.length) {
          candidates = items.filter((it: any) => norm(it.name).includes(titleNorm));
        }
        if (!candidates.length) candidates = items;

        // Cap how many we probe with a detail call, to avoid a request
        // storm on a very generic title.
        const capped = candidates.slice(0, 6);

        const detailResults = await Promise.allSettled(
          capped.map((c: any) =>
            fetch(`https://api.screenopps.com/detail/${c.slug}`).then((r) => r.json())
          )
        );

        let best: { item: any; detail: any } | null = null;
        detailResults.forEach((res, idx) => {
          if (best) return; // first subjectType match wins — no TMDB
          // season-count available here to refine further like DScreen does.
          if (res.status !== "fulfilled") return;
          const subj = res.value?.data?.subject;
          if (!subj || subj.subjectType !== expectedSubjectType) return;
          best = { item: capped[idx], detail: res.value.data };
        });

        // Nothing matched subjectType — fall back to the first candidate we
        // could actually fetch detail for, so we still show *something*.
        if (!best) {
          const firstOk = detailResults.find(
            (r) => r.status === "fulfilled" && (r as any).value?.data
          );
          if (firstOk) {
            const idx = detailResults.indexOf(firstOk);
            best = { item: capped[idx], detail: (firstOk as any).value.data };
          }
        }

        if (cancelled || !best) {
          setSources([]);
          setSubtitles([]);
          return;
        }

        const { item, detail } = best;
        const seasonList = detail?.resource?.seasons ?? [];
        // Movies are filed under se: 0, ep: 0; series start at se/ep from
        // the Season/Episode already chosen upstream (Store.Season/
        // Store.Episode), falling back to the first season entry if those
        // aren't set. Same se=0/ep=0-for-movies convention DScreen uses.
        const isMovie = expectedSubjectType === 1;
        const se = isMovie ? 0 : Number(seasonParam) || seasonList[0]?.se || 1;
        const ep = isMovie ? 0 : Number(episodeParam) || 1;

        const [streamRes, capRes] = await Promise.allSettled([
          fetch(
            `https://api.screenopps.com/api/stream/${item.subject_id}?detail_path=${item.slug}&se=${se}&ep=${ep}`
          ).then((r) => r.json()),
          fetch(
            `https://api.screenopps.com/api/stream/${item.subject_id}/captions?detail_path=${item.slug}&se=${se}&ep=${ep}`
          ).then((r) => r.json()),
        ]);

        if (cancelled) return;

        if (streamRes.status === "fulfilled") {
          const rawSources = streamRes.value?.sources ?? [];
          setSources(
            rawSources
              .filter((s: any) => !!s.url && s.url.trim() !== "")
              .map((s: any) => ({
                quality: s.resolution,
                label: `${s.resolution} · ${s.format}`,
                size: formatBytes(s.size),
                url: s.url,
              }))
          );
        } else {
          console.error("[Player] Failed to load stream info:", streamRes.reason);
          setSources([]);
        }

        if (capRes.status === "fulfilled") {
          const raw = capRes.value;
          const rawCaptions: any[] = Array.isArray(raw)
            ? raw
            : raw?.captions ?? raw?.subtitles ?? raw?.items ?? [];
          setSubtitles(
            rawCaptions
              .map((c: any, idx: number) => ({
                label:
                  typeof c === "string"
                    ? c
                    : c?.lanName || c?.lan || c?.language || `Subtitle ${idx + 1}`,
                url: typeof c === "string" ? "" : c?.url,
              }))
              .filter((c) => !!c.url)
          );
        } else {
          console.error("[Player] Failed to load captions:", capRes.reason);
          setSubtitles([]);
        }
      } catch (err) {
        console.error("[Player] Failed to resolve title/stream:", err);
        if (!cancelled) {
          setSources([]);
          setSubtitles([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [title, paramId, Type, seasonParam, episodeParam]);

  const downloadVtt = async ({ url, label }: { url: string; label: string }) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${label}.vtt`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  const downloadFile = ({ url, quality }: { url: string; quality: string }) => {
    const t = Store.title;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${t} - ${quality}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const qualityColor = (quality: string) => {
    const q = quality?.toUpperCase() ?? "";
    if (q.includes("4K") || q.includes("2160")) return { bg: "#7c3aed", label: "4K" };
    if (q.includes("1080")) return { bg: "#2563eb", label: "FHD" };
    if (q.includes("720")) return { bg: "#059669", label: "HD" };
    if (q.includes("480")) return { bg: "#d97706", label: "SD" };
    return { bg: "#6b7280", label: "SD" };
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .vv-root {
          min-height: 100vh;
          background: #0a0a0f;
          color: #e8e8f0;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Poster backdrop */
        .vv-backdrop {
          position: fixed;
          inset: 0;
          background-image: var(--poster-url);
          background-size: cover;
          background-position: center top;
          opacity: 0.08;
          filter: blur(40px) saturate(1.4);
          z-index: 0;
          pointer-events: none;
        }

        .vv-backdrop-gradient {
          position: fixed;
          inset: 0;
          background: linear-gradient(180deg, #0a0a0f 0%, transparent 30%, transparent 70%, #0a0a0f 100%);
          z-index: 0;
          pointer-events: none;
        }

        .vv-content {
          position: relative;
          z-index: 1;
          max-width: 780px;
          margin: 0 auto;
          padding: 40px 20px 80px;
        }

        /* Header */
        .vv-header {
          display: flex;
          gap: 24px;
          align-items: flex-end;
          margin-bottom: 48px;
          padding-bottom: 32px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .vv-poster {
          width: 100px;
          min-width: 100px;
          aspect-ratio: 2/3;
          border-radius: 10px;
          background: #1a1a2e;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
          flex-shrink: 0;
        }

        .vv-poster img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .vv-poster-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          background: linear-gradient(135deg, #1a1a2e, #16213e);
        }

        .vv-title-block {
          padding-bottom: 4px;
        }

        .vv-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #e63946;
          margin-bottom: 8px;
        }

        .vv-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(32px, 6vw, 52px);
          line-height: 0.95;
          letter-spacing: 0.02em;
          color: #fff;
          margin-bottom: 12px;
        }

        .vv-meta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }

        .vv-badge {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .vv-badge-outline {
          border: 1px solid rgba(255,255,255,0.15);
          color: #a0a0b8;
          background: transparent;
        }

        /* Section */
        .vv-section-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #5a5a7a;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .vv-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.05);
        }

        /* Download cards */
        .vv-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.065);
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 10px;
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s, transform 0.15s;
          text-decoration: none;
          color: inherit;
        }

        .vv-card:hover {
          background: rgba(255,255,255,0.065);
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-1px);
        }

        .vv-card:active {
          transform: translateY(0px);
        }

        .vv-quality-chip {
          width: 52px;
          min-width: 52px;
          height: 52px;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 18px;
          letter-spacing: 0.04em;
          line-height: 1;
          flex-shrink: 0;
        }

        .vv-quality-chip span {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 1px;
          opacity: 0.75;
        }

        .vv-card-info {
          flex: 1;
          min-width: 0;
        }

        .vv-card-quality {
          font-size: 15px;
          font-weight: 600;
          color: #f0f0ff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .vv-card-size {
          font-size: 13px;
          color: #6b6b8e;
          margin-top: 2px;
        }

        .vv-dl-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #e63946;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px 18px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: background 0.15s, opacity 0.15s;
        }

        .vv-dl-btn:hover { background: #c1121f; }
        .vv-card:hover .vv-dl-btn { background: #c1121f; }

        .vv-dl-icon {
          width: 14px;
          height: 14px;
          opacity: 0.9;
        }

        /* Subtitles section */
        .vv-subs-section {
          margin-top: 40px;
        }

        .vv-sub-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.055);
          border-radius: 10px;
          padding: 14px 20px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s;
        }

        .vv-sub-card:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.1);
        }

        .vv-sub-flag {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(255,255,255,0.07);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .vv-sub-label {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          color: #d0d0e8;
        }

        .vv-sub-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          color: #a0a0c0;
          border-radius: 7px;
          padding: 8px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
          white-space: nowrap;
        }

        .vv-sub-card:hover .vv-sub-btn {
          border-color: rgba(255,255,255,0.3);
          color: #fff;
        }

                .vv-unavailable {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 48px 24px;
          background: rgba(255,255,255,0.02);
          border: 1px dashed rgba(255,255,255,0.08);
          border-radius: 14px;
          text-align: center;
        }

        .vv-unavailable svg {
          width: 36px;
          height: 36px;
          color: #3a3a5a;
        }

        .vv-unavailable p {
          font-size: 15px;
          font-weight: 600;
          color: #6a6a8a;
        }

        .vv-unavailable span {
          font-size: 13px;
          color: #3a3a5a;
        }

        /* Loading spinner — round rotating ring, signals "please wait" at
           a glance rather than relying on the text alone. */
        .vv-spinner {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 3px solid rgba(255,255,255,0.08);
          border-top-color: #e63946;
          animation: vv-spin 0.75s linear infinite;
        }

        @keyframes vv-spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 500px) {
          .vv-header { flex-direction: column; align-items: flex-start; gap: 16px; }
          .vv-poster { width: 80px; min-width: 80px; }
          .vv-dl-btn span { display: none; }
          .vv-dl-btn { padding: 10px 12px; }
        }
      `}</style>

      <div className="vv-root" suppressHydrationWarning > 
            <Script
        src="https://quge5.com/88/tag.min.js"
        strategy="afterInteractive"
        data-zone="246496"
        data-cfasync="false"
      />
        {/* Blurred poster backdrop */}
        <div
          className="vv-backdrop"
          style={{ "--poster-url": backgroundposter ? `url(${backgroundposter})` : "none" } as React.CSSProperties}
        />
        <div className="vv-backdrop-gradient" />

        <div className="vv-content">

          {/* Header */}
          <div className="vv-header">
            <div className="vv-poster">
              {backgroundposter ? (
                <img src={backgroundposter} alt={title} />
              ) : (
                <div className="vv-poster-placeholder">🎬</div>
              )}
            </div>
            <div className="vv-title-block">
              <div className="vv-eyebrow">Now Downloading</div>
              <div className="vv-title">{title || "Untitled"}</div>
              <div className="vv-meta">
                <span className="vv-badge vv-badge-outline">
                  {sources?.length ?? 0} {sources?.length === 1 ? "quality" : "qualities"} available
                </span>
                {(subtitles?.length > 0 && sources?.length > 0 ) && (
                  <span className="vv-badge vv-badge-outline">
                    {subtitles.length} subtitles
                  </span>
                )}
              </div>
            </div>
          </div>

                  {/* Video Sources */}
          {loading ? (
            <div className="vv-unavailable">
              <div className="vv-spinner" />
              <p>Loading…</p>
              <span>Fetching available quality and subtitles</span>
            </div>
          ) : sources?.length > 0 ? (
  <div>
    <div className="vv-section-label">Video</div>

    {sources.map((source, index) => {
              const { bg, label } = qualityColor(source.quality);

              return (
                <div
                  key={index}
                  className="vv-card"
                  onClick={() => downloadFile(source)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      downloadFile(source);
                    }
                  }}
                >
                  <div
                    className="vv-quality-chip"
                    style={{
                      background: `${bg}22`,
                      color: bg,
                      border: `1px solid ${bg}44`
                    }}
                  >
                    {label}
                    <span>{source.quality}</span>
                  </div>

                  <div className="vv-card-info">

                    {/* Filename */}
                    <div className="vv-card-quality">
                      {source.label || source.quality}
                    </div>

                    {/* Size */}
                    {source.size &&
                      source.size !== "Unknown" && (
                        <div className="vv-card-size">
                          {source.size}
                        </div>
                    )}

                  </div>

                  <button
                    className="vv-dl-btn"
                    tabIndex={-1}
                  >
                    <svg
                      className="vv-dl-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line
                        x1="12"
                        y1="15"
                        x2="12"
                        y2="3"
                      />
                    </svg>

                    <span>Download</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="vv-unavailable">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line
                x1="4.93"
                y1="4.93"
                x2="19.07"
                y2="19.07"
              />
            </svg>

            <p>Movie currently unavailable</p>
            <span>
              Check back later or try a different movie
            </span>
          </div>
        )}

          {/* Subtitles */}
          {(subtitles?.length > 0 && sources?.length > 0 ) && (
            <div className="vv-subs-section">
              <div className="vv-section-label">Subtitles</div>
              {subtitles.map((sub, index) => {
                return(
                <div
                  key={index}
                  className="vv-sub-card"
                  onClick={() => downloadVtt(sub)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && downloadVtt(sub)}
                >
                  <div className="vv-sub-flag">💬</div>
                  <div className="vv-sub-label">{sub.label}</div>
                  <button className="vv-sub-btn" tabIndex={-1}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    .VTT
                  </button>
                </div>
              )})}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default Player;
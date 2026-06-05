"use client";

const API_BASE = "https://download.screenopps.com/download";
const EMBED_BASE = "https://api.screenopps.com/embed";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white p-10 font-mono">

      <h1 className="text-3xl font-bold mb-8">
        Screenopps API Usage
      </h1>

      {/* MOVIE */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">🎬 Movie Download API</h2>

        <p className="text-gray-400 mb-3">
          Format:
        </p>

        <code className="block bg-zinc-900 p-3 rounded">
          {API_BASE}/movie/&lt;TMDB_ID&gt;
        </code>

        <p className="text-gray-400 mt-3">Example:</p>

        <a
          href={`${API_BASE}/movie/1122573`}
          target="_blank"
          className="text-blue-400 underline"
        >
          {API_BASE}/movie/1122573
        </a>
      </section>

      {/* TV */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">📺 TV Episode Download API</h2>

        <p className="text-gray-400 mb-3">
          Format:
        </p>

        <code className="block bg-zinc-900 p-3 rounded">
          {API_BASE}/tv/&lt;TMDB_ID&gt;/&lt;SEASON&gt;/&lt;EPISODE&gt;
        </code>

        <p className="text-gray-400 mt-3">Example:</p>

        <a
          href={`${API_BASE}/tv/85552/1/1`}
          target="_blank"
          className="text-blue-400 underline"
        >
          {API_BASE}/tv/85552/1/1
        </a>
      </section>

      {/* EMBED */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">🧩 Embed API</h2>

        <p className="text-gray-400 mb-3">
          Format:
        </p>

        <code className="block bg-zinc-900 p-3 rounded">
          {EMBED_BASE}/movie/&lt;TMDB_ID&gt;
        </code>

        <p className="text-gray-400 mt-3">Example:</p>

        <a
          href={`${EMBED_BASE}/movie/533535`}
          target="_blank"
          className="text-blue-400 underline"
        >
          {EMBED_BASE}/movie/533535
        </a>
      </section>

      {/* QUICK TEST */}
      <section className="mt-12 border-t border-zinc-800 pt-6">
        <h2 className="text-lg font-semibold mb-4">
          ⚡ Quick Test Links
        </h2>

        <div className="flex flex-col gap-3">
          <a className="text-green-400 underline" href={`${API_BASE}/movie/1122573`} target="_blank">
            ▶ Movie Test
          </a>

          <a className="text-green-400 underline" href={`${API_BASE}/tv/85552/1/1`} target="_blank">
            ▶ TV Test
          </a>

          <a className="text-green-400 underline" href={`${EMBED_BASE}/movie/533535`} target="_blank">
            ▶ Embed Test
          </a>
        </div>
      </section>

    </main>
  );
}
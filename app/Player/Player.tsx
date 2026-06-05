"use client";

import { useSnapshot } from "valtio";
import { store } from "@/app/store";

const Player = () => {
  const snap = useSnapshot(store);

  const sources = snap.sources;
  const subtitles = snap.subtitles;
  const title = snap.title

// In your subtitle download handler
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
    // fallback: open in new tab, user can save manually
    window.open(url, "_blank");
  }
};



const downloadFile = ({ url, quality }: { url: string; quality: string }) => {
  const title = snap.title
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title} - ${quality}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

  return (
    <div className="min-h-screen w-full bg-black text-white p-6">
      
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold">{title}</h1>
        <p className="text-gray-400 mt-2">Choose quality to download</p>
      </div>

      {/* VIDEO SOURCES */}
      <div className="max-w-2xl mx-auto space-y-4">
        <h2 className="text-xl font-semibold mb-3">🎬 Video Qualities</h2>

        {sources?.map((source, index) => (
          <div
            key={index}
            className="flex items-center cursor-pointer justify-between bg-zinc-900 p-4 rounded-xl border border-zinc-800"
            onClick={()=>{downloadFile(source)}}
          >
            <div>
              <p className="font-semibold">{source.quality}</p>
              {source.size != "Unknown" && <p className="font-semibold">{source.size}</p>}
            </div>

         <button
          
        className="bg-red-600 px-4 py-2 rounded cursor-pointer"
        >
        Download
      </button>
          </div>
        ))}
      </div>

      {/* SUBTITLES */}
      {subtitles?.length > 0 && (
        <div className="max-w-2xl mx-auto mt-10 space-y-4">
          <h2 className="text-xl font-semibold mb-3">📝 Subtitles</h2>

          {subtitles.map((sub, index) => (
            <div
              key={index}
              className="flex items-center cursor-pointer justify-between bg-zinc-900 p-4 rounded-xl border border-zinc-800"
              onClick={()=>{downloadVtt(sub)}}
            >
              <div>
                <p className="font-semibold">{sub.label}</p>
              </div>

               <button
             
            className="bg-red-600 px-4 py-2 rounded cursor-pointer"
        >
            Download
            </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Player;
"use client";
import { Turnstile } from "@marsidev/react-turnstile";
import { store } from "../store";
export default function Loading() {


  return (
    <div className="relative flex items-center justify-center w-full h-screen bg-black overflow-hidden">
  {/* Spinner behind */}
  <div className="absolute">
    <div className="w-7 h-7 rounded-full border-2 border-white/20 border-t-white animate-spin" />
  </div>

  {/* Turnstile on top */}
  <div className="relative z-10">
    <Turnstile
      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
      onSuccess={async (token) => {
        const res = await fetch("/api/verify-turnstile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (data.success) {
          store.token = true;
        }
      }}
    />
  </div>
</div>
  );
}
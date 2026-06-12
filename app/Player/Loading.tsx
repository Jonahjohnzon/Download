"use client";
import { Turnstile } from "@marsidev/react-turnstile";
import { ServerFallback } from "../UseServerFallback";
import { useSnapshot } from "valtio";
import { store } from "../store";
import { useState } from "react";

export default function Loading() {
    const Store = useSnapshot(store);
    const paramId = Store.ParamId
    const Type = Store.Type
    const season = Store.Season
    const episode = Store.Episode
    const [verified, setVerified] = useState(false);

    return (
        <div className="relative flex items-center justify-center w-full h-screen bg-black overflow-hidden">
            {/* Spinner behind */}
            <div className="absolute">
                <div className="w-7 h-7 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            </div>

            {/* Turnstile on top */}
            {!verified && (
                <div className="relative z-10">
                    <Turnstile
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                        onSuccess={async (token) => {
                            setVerified(true);
                            if (Type == 'movie') {
                                await ServerFallback({ paramId, Type: 'movie', token })
                            } else {
                                await ServerFallback({ paramId, Type: 'tv', Season: season, Episode: episode, token })
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
}
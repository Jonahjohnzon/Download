import { decrypt, deriveKey } from './decrypt.js';

const BASE_URL   = 'https://core.vidzee.wtf';
const PLAYER_URL = 'https://player.vidzee.wtf';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.7051.98 Safari/537.36',
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: PLAYER_URL,
    Origin: PLAYER_URL
};

const PROVIDER = { id: 'vidzee', name: 'VidZee' };

// ── Provider ──────────────────────────────────────────────────────────────────

export const vidZeeProvider = async (media) => {
    try {
        const decKey = await fetchDecryptionKey();
        
        if (!decKey) return emptyResult('Failed to fetch decryption key');
        // fetch all 14 servers in parallel

        const results = await Promise.allSettled(
            Array.from({ length: 14 }, (_, i) => fetchServer(media, i))
        );

        const responses = results
            .filter(r => r.status === 'fulfilled' && r.value)
            .map(r => r.value);
        
        if (!responses.length) return emptyResult('No working servers');
        
        // decrypt all links in parallel
        const decrypted = await Promise.all(
            responses.map(async (res) => ({
                res,
                links: await Promise.all(res.url.map(u => decrypt(u.link, decKey)))
            }))
        );

        const subtitles = new Map();
        const allLinks  = [];

        for (const { res, links } of decrypted) {
            allLinks.push(...links);

            for (const track of res.tracks) {
                if (!track.url || !track.lang) continue;
                const key = `${track.lang}_${res.serverInfo?.number}`;
                if (!subtitles.has(key)) {
                    subtitles.set(key, {
                        url: track.url,
                        label: track.lang.replace(/\d+/g, '').trim(),
                        format: 'vtt'
                    });
                }
            }
        }

        const sources = [...new Set(allLinks)]
            .filter(link => link?.startsWith('http'))
            .map(link => ({
                url: link,
                type: 'hls',
                quality: inferQuality(link),
                audioTracks: [{
                    language: link.includes('phim1280.tv') ? 'vie' : 'eng',
                    label:    link.includes('phim1280.tv') ? 'Vietnamese' : 'English'
                }],
                provider: PROVIDER
            }));

           console.log('VidZee sources:', sources);

        return { sources, subtitles: [...subtitles.values()], diagnostics: [] };
    } catch (error) {
        return emptyResult(error instanceof Error ? error.message : 'Unknown error');
    }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchServer(media, serverId) {
    try {
        let url = `${PLAYER_URL}/api/server?id=${media.Tmdb_Id}&sr=${serverId}`;
        if (media.Type === 'tv') url += `&ss=${media.Season}&ep=${media.Episode}`;

        const res = await fetch(url, { headers: HEADERS });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function fetchDecryptionKey() {
    try {
        const res = await fetch(`${BASE_URL}/api-key`, { headers: HEADERS });
        if (res.status !== 200) return null;
        const data = await res.text();
        return data ? await deriveKey(data) : null;
    } catch {
        return null;
    }
}

function inferQuality(link) {
    if (link.includes('1080')) return '1080p';
    if (link.includes('720'))  return '720p';
    if (link.includes('480'))  return '480p';
    if (link.includes('360'))  return '360p';
    return 'auto';
}

function emptyResult(message) {
    return {
        sources: [],
        subtitles: [],
        diagnostics: [{
            code: 'PROVIDER_ERROR',
            message: `VidZee: ${message}`,
            field: '',
            severity: 'error'
        }]
    };
}

export async function healthCheck() {
    try {
        const res = await fetch(BASE_URL, { method: 'HEAD', headers: HEADERS });
        return res.status === 200;
    } catch {
        return false;
    }
}
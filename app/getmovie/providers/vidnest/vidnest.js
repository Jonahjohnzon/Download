import decrypt from './decrypt';

const BASE_URL = 'https://vidnest.fun';
const API_BASE_URL = 'https://new.vidnest.fun';
const WORKER_URL = 'https://steam-proxy.hadezanubiz.workers.dev';

function proxyUrl(url) {
    const referer = getReferer(url);
    return `${WORKER_URL}/proxy?path=${encodeURIComponent(url)}&referer=${encodeURIComponent(referer)}&origin=${encodeURIComponent(referer)}`;
}

function getReferer(url) {
    try {
        const host = new URL(url).hostname;

        if (host.includes('hakunaymatata.com'))  return 'https://vidnest.fun/';
        if (host.includes('gemma416okl.com'))     return 'https://vidnest.fun/';
        if (host.includes('senpai-stream.club'))  return 'https://vidnest.fun/';
        if (host.includes('goodstream.cc'))       return 'https://goodstream.cc/';
        if (host.includes('boosterx.stream'))     return 'https://boosterx.stream/';
        if (host.includes('vix-content.net'))     return 'https://vixsrc.to/';

        return BASE_URL + '/'; // default fallback
    } catch {
        return BASE_URL + '/';
    }
}
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150 Safari/537.36',
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: `${BASE_URL}/`,
    Origin: BASE_URL
};

const SERVERS = [
    { path: 'moviebox',    query: '' },
    { path: 'allmovies',   query: '' },
    { path: 'catflix',     query: '' },
    { path: 'purstream',   query: '' },
    { path: 'hollymoviehd', query: '' },
    { path: 'lamda',       query: '' },
    { path: 'flixhq',      query: '' },
    { path: 'vidlink',     query: '' },
    { path: 'onehd',       query: '?server=upcloud' },
    { path: 'klikxxi',     query: '' }
];

const PROVIDER = { id: 'vidnest', name: 'VidNest' };

// ── Handlers ──────────────────────────────────────────────────────────────────

const handlers = {
    klikxxi: {
        parse: (d) => decrypt(d),
        mapSources: (root) => root.sources.map((s) => ({
            url: proxyUrl(s.url),
            type: inferSourceType(s.type, s.url),
            quality: s.quality,
            audioTracks: [],
            provider: PROVIDER
        })),
        mapSubtitles: () => []
    },

    allmovies: {
        parse: (d) => decrypt(d),
        mapSources: (root) => root.streams.map((s) => ({
            url: proxyUrl(s.url),
            type: inferSourceType(s.type, s.url),
            quality: 'Auto',
            audioTracks: [{ language: s.language, label: s.language }],
            provider: PROVIDER
        })),
        mapSubtitles: () => []
    },

    onehd: {
        parse: (d) => decrypt(d),
        mapSources: (root) => [{
            url: proxyUrl(root.url),
            type: inferSourceType('', root.url),
            quality: 'Auto',
            audioTracks: [{ language: 'English', label: 'eng' }],
            provider: PROVIDER
        }],
        mapSubtitles: (root) => root.subtitles.map((s) => ({
            url: proxyUrl(s.url),
            label: s.lang,
            format: inferSubtitleFormat(s.url)
        }))
    },

    hollymoviehd: {
        parse: (d) => decrypt(d),
        mapSources: (root) => root.sources.map((s) => ({
            url: proxyUrl(s.file),
            type: inferSourceType(s.type, s.file),
            quality: s.label,
            audioTracks: [{ language: 'English', label: 'eng' }],
            provider: PROVIDER
        })),
        mapSubtitles: () => []
    },

    vidlink: {
        parse: (d) => decrypt(d),
        mapSources: (root) => [{
            url: proxyUrl(root.data.stream.playlist),
            type: inferSourceType(root.data.stream.type, root.data.stream.playlist),
            quality: 'Auto',
            audioTracks: [{ language: 'English', label: 'eng' }],
            provider: PROVIDER
        }],
        mapSubtitles: (root) => root.data.stream.captions.map((c) => ({
            url: proxyUrl(c.url),
            label: c.language,
            format: inferSubtitleFormat(c.url)
        }))
    },

    delta: {
        parse: (d) => decrypt(d),
        mapSources: (root) => root.streams.map((s) => ({
            url: proxyUrl(s.url),
            type: inferSourceType(s.type, s.url),
            quality: 'Auto',
            audioTracks: [{ language: s.language.slice(0, 3), label: s.language }],
            provider: PROVIDER
        })),
        mapSubtitles: () => []
    },

    purstream: {
        parse: (d) => decrypt(d),
        mapSources: (root) => root.sources.map((s) => ({
            url: proxyUrl(s.url),
            type: inferSourceType(s.format, s.url),
            quality: s.name,
            audioTracks: [{ language: 'French', label: 'fr' }],
            provider: PROVIDER
        })),
        mapSubtitles: () => []
    },

   moviebox: {
    parse: (d) => decrypt(d),
    mapSources: (root) => root.url.map((u) => ({
        url: proxyUrl(u.link), // 👈 was u.link, now proxied
        type: inferSourceType(u.type, u.link),
        quality: 'Auto',
        audioTracks: [{ language: u.lang.slice(0, 3), label: u.lang }],
        provider: PROVIDER
    })),
    mapSubtitles: () => []
},
};

// ── Provider ──────────────────────────────────────────────────────────────────

export const vidNestProvider = async (media) => {
    return getSources(media);
};

async function getSources(media) {
    const sources = [];
    const subtitles = [];
    const diagnostics = [];

    const promises = SERVERS.map((server) => {
        const url = media.Type === 'movie'
            ? buildMovieUrl(media, server.path) + server.query
            : buildTvUrl(media, server.path) + server.query;
        return fetchVidnest(url);
    });
    
    const results = await Promise.allSettled(promises);
    const allFailed = results.every((r) => r.status === 'rejected');
    if (allFailed) {
        diagnostics.push({
            code: 'PARTIAL_SCRAPE',
            field: '',
            message: `VidNest: all servers failed`,
            severity: 'error'
        });
    }

    results.forEach((result, i) => {
        if (result.status !== 'fulfilled') return;

        const server = SERVERS[i];
        const handler = handlers[server.path];

        if (!handler) {
            diagnostics.push({
                code: 'PARTIAL_SCRAPE',
                field: '',
                message: `VidNest: no handler for ${server.path}`,
                severity: 'warning'
            });
            return;
        }

        const { sources: s, subtitles: sub } = handleServer(server.path, result.value.data);
        sources.push(...s);
        subtitles.push(...sub);
    });


    return { sources, subtitles, diagnostics };
}

function handleServer(key, data) {
    const handler = handlers[key];
    const root = handler.parse(data);
    return {
        sources: handler.mapSources(root),
        subtitles: handler.mapSubtitles(root)
    };
}

function buildMovieUrl(media, server) {
    return `${API_BASE_URL}/${server}/movie/${media.Tmdb_Id}`;
}

function buildTvUrl(media, server) {
    return `${API_BASE_URL}/${server}/tv/${media.Tmdb_Id}/${media.Season}/${media.Episode}`;
}

async function fetchVidnest(url) {
    const proxied = `${WORKER_URL}/proxy?path=${encodeURIComponent(url)}&referer=${encodeURIComponent(BASE_URL)}&origin=${encodeURIComponent(BASE_URL)}`;
    const res = await fetch(proxied);

    if (!res.ok) throw new Error(`VidNest: ${res.status}`);

    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('text/html')) {
        throw new Error('VidNest: Cloudflare challenge');
    }

    return res.json();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function inferSourceType(type, url) {
    const t = (type ?? '').toLowerCase();
    if (t === 'hls'  || url.includes('.m3u8')) return 'hls';
    if (t === 'dash' || url.includes('.mpd'))  return 'dash';
    if (t === 'mp4'  || url.includes('.mp4'))  return 'mp4';
    if (t === 'mkv'  || url.includes('.mkv'))  return 'mkv';
    if (t === 'webm' || url.includes('.webm')) return 'webm';
    if (t === 'embed')                          return 'embed';
    return 'hls';
}

function inferSubtitleFormat(url) {
    const u = url.toLowerCase();
    if (u.includes('.vtt'))  return 'vtt';
    if (u.includes('.srt'))  return 'srt';
    if (u.includes('.ass'))  return 'ass';
    if (u.includes('.ssa'))  return 'ssa';
    if (u.includes('.ttml')) return 'ttml';
    return 'vtt';
}

export async function healthCheck() {
    try {
        const res = await fetch(BASE_URL, { method: 'HEAD', headers: HEADERS });
        return res.status === 200;
    } catch {
        return false;
    }
}
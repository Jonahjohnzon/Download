const BASE_URL = 'https://api.anyembed.xyz';
const FRONTEND_URL = 'https://anyembed.xyz';

const provider = {
  id: 'anyembed',
  name: 'AnyEmbed',
};

const HEADERS = {
  'User-Agent': '',
  accept: '*/*',
  referer: FRONTEND_URL,
  origin: FRONTEND_URL,
  'x-session-token': '',
};

function generateRandomUserAgent() {
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150 Safari/537.36',
  ];

  return agents[
    Math.floor(Math.random() * agents.length)
  ];
}

function createProxyUrl(url, headers = {}) {
  const proxy =
    'https://steam-proxy.hadezanubiz.workers.dev';

  return (
    `${proxy}?path=` +
    encodeURIComponent(url) +`&origin=` +
    encodeURIComponent(FRONTEND_URL) + `&referer=` + encodeURIComponent(FRONTEND_URL) 
  );
}

function emptyResult(message) {
  return {
    sources: [],
    subtitles: [],
    diagnostics: [
      {
        code: 'PROVIDER_ERROR',
        message: `${provider.name}: ${message}`,
        field: '',
        severity: 'error',
      },
    ],
  };
}

async function getToken() {
  const req = await fetch(
    BASE_URL + '/api/v1/session',
    {
      headers: HEADERS,
    }
  );

  const resp = await req.json();

  if (resp.token) {
    return resp.token;
  }

  throw new Error('No token found');
}

async function healthCheck() {
  try {
    const response = await fetch(BASE_URL, {
      method: 'HEAD',
      headers: HEADERS,
    });

    return response.status === 200;
  } catch {
    return false;
  }
}

async function getApiResponse(media) {
  const url = `${BASE_URL}/api/v1/stream/${media.Tmdb_Id}`;

  const response = await fetch(url, {
    headers: HEADERS,
  });

  return response.json();
}

function inferSourceType(url) {
  const cleanUrl = url
    .split('?')[0]
    .toLowerCase();

  if (cleanUrl.endsWith('.m3u8')) return 'hls';
  if (cleanUrl.endsWith('.mpd')) return 'dash';
  if (cleanUrl.endsWith('.mp4')) return 'mp4';
  if (cleanUrl.endsWith('.mkv')) return 'mkv';
  if (cleanUrl.endsWith('.webm')) return 'webm';

  return 'hls';
}

function inferSubtitleFormat(url) {
  const cleanUrl = url
    .split('?')[0]
    .toLowerCase();

  if (cleanUrl.endsWith('.vtt')) return 'vtt';
  if (cleanUrl.endsWith('.srt')) return 'srt';
  if (cleanUrl.endsWith('.ass')) return 'ass';
  if (cleanUrl.endsWith('.ssa')) return 'ssa';

  if (
    cleanUrl.endsWith('.ttml') ||
    cleanUrl.endsWith('.xml')
  ) {
    return 'ttml';
  }

  return 'vtt';
}

function mapToProviderResult(apiResponse) {
  const diagnostics = [];

  const subtitlesMap = new Map();

  const sources = [];

  if (!apiResponse.success) {
    return emptyResult(
      'AnyEmbed returned unsuccessful response'
    );
  }

  for (const providerSource of apiResponse.sources || []) {
    for (const stream of providerSource.streams || []) {
      const type = inferSourceType(stream.url);

      sources.push({
        url: stream.url,

        type,

        quality: stream.quality || 'unknown',

        audioTracks: [
          {
            label: 'English',
            language: 'en',
          },
        ],

        provider,
      });

      for (const sub of stream.subtitles || []) {
        const key = `${sub.url}::${sub.label}`;

        if (!subtitlesMap.has(key)) {
          const format = inferSubtitleFormat(sub.url);

          subtitlesMap.set(key, {
            url: createProxyUrl(sub.url),

            label:
              sub.label ||
              sub.language ||
              'Unknown',

            format,
          });
        }
      }
    }
  }

  console.log(sources)
  return {
    sources,
    subtitles: [...subtitlesMap.values()],
    diagnostics,
  };
}

async function getSources(media) {
  try {
    HEADERS['User-Agent'] =
      generateRandomUserAgent();

    const session = await getToken();

    if (!session) {
      throw new Error(
        'Failed to obtain session token'
      );
    }

    HEADERS['x-session-token'] = session;

    const apiResponse = await getApiResponse(media);

    return mapToProviderResult(apiResponse);
  } catch (error) {
    return emptyResult(
      error instanceof Error
        ? error.message
        : 'Failed to process sources'
    );
  }
}

export async function AnyembedProvider(media) {
  return getSources(media);
}




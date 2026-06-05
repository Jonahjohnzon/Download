const BASE_URL = 'https://cine.su';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150 Safari/537.36',
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: BASE_URL + '/en/watch',
  Origin: BASE_URL,
};

const provider = {
  id: 'CineSu',
  name: 'CineSu',
};

function createProxyUrl(url) {
  return (
    'https://steam-proxy.hadezanubiz.workers.dev' +
    '?path=' +
    encodeURIComponent(url) +
    '&referer=' +
    encodeURIComponent('https://cine.su/') +
    '&origin=' +
    encodeURIComponent('https://cine.su')
  );
}

function emptyResult(message) {
  return {
    sources: [],
    subtitles: [],
    diagnostics: [
      {
        code: 'PROVIDER_ERROR',
        message: `CineSu: ${message}`,
        field: '',
        severity: 'error',
      },
    ],
  };
}

function buildManifestUrl(media) {
  if (media.Type === 'movie') {
    return `${BASE_URL}/v1/stream/master/movie/${media.Tmdb_Id}.m3u8`;
  }

  if (media.Type === 'tv') {
    return `${BASE_URL}/v1/stream/master/tv/${media.Tmdb_Id}/${media.Season}/${media.Episode}.m3u8`;
  }

  throw new Error('Unsupported media type');
}

async function testUrl(url) {
  try {
    const res = await fetch(createProxyUrl(url), {
      method: 'HEAD',
      headers: HEADERS,
    });
    console.log(`CineSu URL test: ${url} - Status: ${res.status}`);
    return res.status === 200;
  } catch {
    return false;
  }
}

async function getSources(streamUrl) {
  try {
    return {
      sources: [
        {
          url: createProxyUrl(streamUrl),
          quality: '1080',
          type: 'hls',
          audioTracks: [
            {
              label: 'English',
              language: 'eng',
            },
          ],
          provider,
        },
      ],
      subtitles: [],
      diagnostics: [],
    };
  } catch (error) {
    return emptyResult(
      error instanceof Error
        ? error.message
        : 'Unknown provider error'
    );
  }
}

export async function CineScrape(media) {
  const streamUrl = buildManifestUrl(media);

  const verify = await testUrl(streamUrl);
  if (!verify) {
    return emptyResult('Stream URL is not accessible');
  }

  return getSources(streamUrl);
}

export async function getTVSources(media) {
  const streamUrl = buildManifestUrl(media);

  const verify = await testUrl(streamUrl);

  if (!verify) {
    return emptyResult('Stream URL is not accessible');
  }

  return getSources(streamUrl);
}

export async function healthCheck() {
  try {
    const res = await fetch(BASE_URL, {
      method: 'HEAD',
      headers: HEADERS,
    });

    return res.status === 200;
  } catch {
    return false;
  }
}


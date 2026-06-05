import { encryptItemId } from './encrypt';
import { getCurrentWorker } from '../proxy';

const BASE_URL = 'https://vidrock.ru/';
const SUB_BASE_URL = 'https://sub.vdrk.site';





function proxyUrl(url,quality) {
     

  const worker = "https://morning-meadow-f3f0.hadezanubiz.workers.dev";
  return `${worker}/download?path=${encodeURIComponent(url)}&quality=${encodeURIComponent(quality)}`;
}
const HEADERS = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150 Safari/537.36',
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: BASE_URL,
    Origin: BASE_URL
};

export const vidRockProvider = (media) =>{

    return getSources(media);

}

const formatSize = (bytes) => {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
};

const getFileSize = async (url) => {
  try {
    console.log("HELLO")
    const worker = "https://morning-meadow-f3f0.hadezanubiz.workers.dev";
    const res = await fetch(
      `${worker}/info?path=${encodeURIComponent(url)}`
    );
   console.log("WORKER RESPONSE STATUS:", res.status);
   
    const { size } = await res.json();
    console.log(size)
   
    return size ? formatSize(size) : "Unknown";
  } catch (err){
    console.log(err)
    return "Unknown";
  }
};

async function getSources(media) {
    try {
        
        const pageUrl = await buildUrl(media);
        const data = await fetchPage(pageUrl);
       
        if (!data) {
            return emptyResult('Failed to fetch page');
        }
        const mp4Only = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value.type === "mp4")
            );

        const stream = Object.values(mp4Only)[0];
        if (!stream?.url) {
            return emptyResult('Failed to fetch page');
            }

            const response = await fetchPage(stream.url)
        
            const sorted = response.sort((a, b) => b.resolution - a.resolution);
       
       const sources = await Promise.all(
         sorted.map(async ({ url, resolution }) => {
            const size = await getFileSize(url);

             return {
             url: proxyUrl(url, `${media.Title} - ${resolution}p`),
            size,
            type: "mp4",
            quality: `${resolution}p`,
            label: `${resolution}p`,
             provider: {
              id: "Screenopps",
             name: "Screenopps",
             },
         };
         })
            );
 

        const subtitles = await fetchSubtitles(media);
    
        return {
            sources,
            subtitles,
            diagnostics: []
        };

    } catch (error) {
        return emptyResult(
            error instanceof Error ? error.message : 'Unknown provider error'
        );
    }
}

async function fetchSubtitles(media) {
    try {
        let subUrl;
        if (media.type === 'tv') {
            subUrl = `${SUB_BASE_URL}/v2/tv/${media.Tmdb_Id}/${media.Season}/${media.Episode}`;
        } else {
            subUrl = `${SUB_BASE_URL}/v2/movie/${media.Tmdb_Id}`;
        }
  
        const response = await fetch(subUrl, {
            headers: {
                ...HEADERS,
                Referer: BASE_URL
            }
        });
        
        if (response.status !== 200) return [];

        const subsData = await response.json();
        return subsData.map((sub) => ({
            url: sub.file,
            format: 'vtt',
            label: sub.label
        }));
    } catch {
        return [];
    }
}
async function buildUrl(media) {
    let itemId;
    if (media.Type === 'tv') {
        itemId = `${media.Tmdb_Id}_${media.Season}_${media.Episode}`;
    } else {
        itemId = `${media.Tmdb_Id}`;
    }

    const encrypted = await encryptItemId(itemId);
    return `${BASE_URL}api/${media.Type}/${encrypted}`;
}

async function fetchPage(url) {
    try {
        const response = await fetch(url, {
            headers: { ...HEADERS, Referer: BASE_URL },
            referrer: BASE_URL
        });

        if (response.status !== 200) return null;

        const contentType = response.headers.get('content-type') ?? '';

        if (contentType.includes('application/json')) {
            return await response.json();
        }

        return await response.text();
    } catch {
        return null;
    }
}


function emptyResult(message) {
    return {
        sources: [],
        subtitles: [],
        diagnostics: [
            {
                code: 'PROVIDER_ERROR',
                message: `VidRock: ${message}`,
                field: '',
                severity: 'error'
            }
        ]
    };
}

export async function healthCheck() {
    try {
        const response = await fetch(BASE_URL, {
            method: 'HEAD',
            headers: HEADERS
        });
        return response.status === 200;
    } catch {
        return false;
    }
}

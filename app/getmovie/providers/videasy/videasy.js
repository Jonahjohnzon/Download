
const BASE_URL = 'https://videasy.net';
const PLAYER_URL = 'https://player.videasy.net';

const HEADERS = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150 Safari/537.36',
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: PLAYER_URL,
    Origin: PLAYER_URL
};

export const EagleProvider = async (media) => {
                console.log('Fetching sources for media:', media);

    getSources(media);
}

async function fetchPage(url) {
    try {
        const response = await fetch(url,{
            headers: { ...HEADERS, Referer: PLAYER_URL },
            referrer: PLAYER_URL
        });
        if (response.status !== 200) return null;
        return await response.text();
    } catch (err) {
        console.error('[fetchPage] error:', err.message);
        return null;
    }      
 }



const getSources = async (media) => {
        try {
            const pageContent = await fetchPage(`${PLAYER_URL}/movie/${media.Tmdb_Id}`);
            if (!pageContent) return { error: 'Failed to fetch page content.' };

        }
            catch (error) {
                return { error: error instanceof Error ? error.message : 'Unknown provider error' };
            }
}
const cache = new Map();

const getCacheKey = (Tmdb_Id, Type, Season, Episode, Server) => {
    if (Type === 'tv') return `${Server}-${Type}-${Tmdb_Id}-${Season}-${Episode}`;
    return `${Server}-${Type}-${Tmdb_Id}`;
};

const CACHE_TTL = {
    Vixsrc:  1000 * 60 * 30,           // 30 min
    Vidrock: 1000 * 60 * 60 * 24 * 10, // 10 days — override default if needed
    default: 1000 * 60 * 60 * 24 * 10  // 10 days for everything else
};

const getTTL = (Server) => CACHE_TTL[Server] ?? CACHE_TTL.default;

const SERVER_ORDER = ['Viper', 'Eagle'];

const fetchFromServer = async (Server, media) => {
    switch (Server) {
        case 'Viper': {
            const { vidRockProvider } = await import('../providers/vidrock/vidrock');
            return await vidRockProvider(media);
        }
        case 'Eagle': {
            const { novaProvider } = await import('../providers/nova/nova');
            return await novaProvider(media);
        }
        default:
            return { error: 'Unsupported server.' };
    }
};

export const utill = async (Tmdb_Id, Type, Season, Episode, Server, Title) => {
    try {
        const startIndex = SERVER_ORDER.indexOf(Server);
        const serversToTry = startIndex !== -1
            ? SERVER_ORDER.slice(startIndex)
            : [Server];

        let lastResult;

        for (const currentServer of serversToTry) {
            const key = getCacheKey(Tmdb_Id, Type, Season, Episode, currentServer);
            const ttl = getTTL(currentServer);

            if (cache.has(key)) {
                const { data, timestamp } = cache.get(key);
                if (Date.now() - timestamp < ttl) {
                    if (data?.sources?.length > 0) {
                        return data;
                    }
                } else {
                    cache.delete(key);
                }
            }

            const media = { Tmdb_Id, Type, Season, Episode, Server: currentServer, Title };
            const data = await fetchFromServer(currentServer, media);
            lastResult = data;

            if (data?.sources?.length > 0) {
                cache.set(key, { data, timestamp: Date.now() });
                return data;
            }
        }

        // All servers exhausted — return the last response (even if empty)
        return lastResult;
    } catch (error) {
        console.error(error);
        return { error: 'An error occurred while fetching data.' };
    }
};
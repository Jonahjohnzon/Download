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

export const utill = async (Tmdb_Id, Type, Season, Episode, Server) => {
    try {
        const key = getCacheKey(Tmdb_Id, Type, Season, Episode, Server);
        const ttl = getTTL(Server);

        if (cache.has(key)) {
            const { data, timestamp } = cache.get(key);
            if (Date.now() - timestamp < ttl) {
                return data;
            }
            cache.delete(key);
        }


        const media = { Tmdb_Id, Type, Season, Episode, Server };
        let data;

        switch (Server) {
            case 'Viper':
                const { vidRockProvider } = await import('../providers/vidrock/vidrock');
                data = await vidRockProvider(media);
                break;
            case 'Bear':
                const { vixSrcProvider } = await import('../providers/vixsrc/vixsrc');
                data = await vixSrcProvider(media);
                break;
            case 'VidNest':
                const { vidNestProvider } = await import('../providers/vidnest/vidnest');
                data = await vidNestProvider(media);
                break;
            case 'VidZee':
                const { vidZeeProvider } = await import('../providers/vidzee/vidzee');
                data = await vidZeeProvider(media);
                break;
            case 'CineSu':
                const { CineScrape } = await import('../providers/cine/cine');
                data = await CineScrape(media);
                break;
            case 'Anyembed':
                const { AnyembedProvider } = await import('../providers/anyembed/anyembed');
                data = await AnyembedProvider(media);
                break;
            case 'Eagle':
                const { EagleProvider } = await import('../providers/videasy/videasy');
                data = await EagleProvider(media);
                break;
            default:
                return { error: 'Unsupported server.' };
        }

        if (data?.sources?.length > 0) {
            cache.set(key, { data, timestamp: Date.now() });
        }

        return data;
    } catch (error) {
        console.error(error);
        return { error: 'An error occurred while fetching data.' };
    }
};
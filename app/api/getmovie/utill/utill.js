const SERVER_ORDER = ['Viper', 'Eagle'];

const fetchFromServer = async (Server, media) => {
    switch (Server) {
        case 'Viper': {
            const { fzProvider } = await import('../providers/fzmovies/fzmovies');
            return await fzProvider(media);
        }

        case 'Eagle': {
            const { novaProvider } = await import('../providers/nova/nova');
            return await novaProvider(media);
        }

        default:
            return { error: 'Unsupported server.' };
    }
};

export const utill = async (
    Tmdb_Id,
    Type,
    Season,
    Episode,
    Server,
    Title
) => {
    try {
        const startIndex = SERVER_ORDER.indexOf(Server);

        const serversToTry =
            startIndex !== -1
                ? SERVER_ORDER.slice(startIndex)
                : [Server];

        let lastResult;

        for (const currentServer of serversToTry) {

            const media = {
                Tmdb_Id,
                Type,
                Season,
                Episode,
                Server: currentServer,
                Title
            };

            const data = await fetchFromServer(
                currentServer,
                media
            );

            lastResult = data;

            // If this server returned sources, use them
            if (data?.sources?.length > 0) {
                return data;
            }
        }

        // All servers failed / returned empty
        return lastResult;

    } catch (error) {
        console.error(error);

        return {
            error: 'An error occurred while fetching data.'
        };
    }
};
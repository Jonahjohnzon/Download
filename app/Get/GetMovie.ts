export const GetMovieFetch = async ({ Tmdb_Id, Type, Server, Season, Episode }: { Tmdb_Id: string; Type: string; Server: string; Season?: string; Episode?: string }) => {
    try {
        const params = new URLSearchParams({ Tmdb_Id, Type, Server });

        if (Season) params.append('Season', Season);
        if (Episode) params.append('Episode', Episode);
        const response = await fetch(`/api?${params.toString()}`);
        return await response.json();
    } catch {
        return {
            sources: [],
            subtitles: [],
            diagnostics: []
        };
}}


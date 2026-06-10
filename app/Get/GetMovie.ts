

export const GetMovieFetch = async ({ Tmdb_Id, Type, Server, Season, Episode, token }: { Tmdb_Id: string; Type: string; Server: string; Season?: string; Episode?: string; token?:string }) => {
    try {
        
        const params = new URLSearchParams({ Tmdb_Id, Type, Server });

        if (Season) params.append('Season', Season);
        if (Episode) params.append('Episode', Episode);
        const response = await fetch(`/api?${params.toString()}`, {
         method: "GET",
         headers: {
        ...(token ? { "x-turnstile-token": token } : {}),
        },
         });
        return await response.json();
    } catch {
        return {
            sources: [],
            subtitles: [],
            diagnostics: []
        };
}}


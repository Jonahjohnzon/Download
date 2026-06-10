"use server"
const { NextResponse } = await import('next/server')
const { utill } = await import('./getmovie/utill/utill')

const fetchTMDB = async (Tmdb_Id, Type, Season, Episode, TMDB_API_KEY) => {
    try {

        const headers = {
            Authorization: `Bearer ${TMDB_API_KEY}`,
            'Content-Type': 'application/json'
        };

        //check if imdb
        let tmdbId = Tmdb_Id;
        if (/^tt\d+$/.test(Tmdb_Id)) {
            
         const findResp = await fetch(
        `https://api.themoviedb.org/3/find/${Tmdb_Id}?external_source=imdb_id`,
        { headers }
            );

         const findData = await findResp.json();

      if (Type === "movie") {
        tmdbId = findData.movie_results?.[0]?.id;
      } else {
        tmdbId = findData.tv_results?.[0]?.id;
      }
        }
        
        const base = `https://api.themoviedb.org/3/${Type}/${tmdbId }`;
  

        const [mainRes, externalRes] = await Promise.all([
            fetch(base, { headers }),
            fetch(`${base}/external_ids`, { headers })
        ]);

        const data = await mainRes.json();
        const external = await externalRes.json();
        // tv uses 'name', movie uses 'title'
        const title = data.title || data.name || 'Unknown';
        const poster = data.poster_path
            ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
            : null;
        const backdrop = data.backdrop_path
            ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
            : null;
        const overview = data.overview || '';
        const imdb_id = external.imdb_id || null;

        // for tv episodes get episode title and still
        let episode_title = null;
        let episode_still = null;
        if (Type === 'tv' && Season && Episode) {
            const epRes = await fetch(
                `${base}/season/${Season}/episode/${Episode}`,
                { headers }
            );
            const epData = await epRes.json();
            episode_title = epData.name || null;
            episode_still = epData.still_path
                ? `https://image.tmdb.org/t/p/w500${epData.still_path}`
                : null;
        }

        return { title, poster, backdrop, overview, imdb_id, episode_title, episode_still, tmdbId };
    } catch {
        return { title: 'Unknown', poster: null, backdrop: null, overview: '', imdb_id: null, tmdbId };
    }
};

export const GET = async (req) => {
    const TMDB_API_KEY = process.env.DB_BEARER;
    try {
        const token = req.headers.get("x-turnstile-token");
          if (!token) {
        return NextResponse.json(
        { success: false, error: "Missing token" },
        { status: 400 }
         );
        }
        const Url = new URL(req.url)
        const Tmdb_Id = Url.searchParams.get('Tmdb_Id')
        const Type = Url.searchParams.get('Type')
        const Season = Url.searchParams.get('Season')
        const Episode = Url.searchParams.get('Episode')
        const Server = Url.searchParams.get('Server')
        
     
        if (!Tmdb_Id || !Type || !Server) {
            return NextResponse.json({ error: 'Missing required query parameters.' }, { status: 400 })
        }

        if (Type === 'tv' && (!Season || !Episode)) {
            return NextResponse.json({ error: 'Missing Season/Episode parameters for TV type.' }, { status: 400 })
        }

            const formData = new URLSearchParams();
            formData.append("secret", process.env.TURNSTILE_SECRET);
            formData.append("response", token);

             const results = await fetch(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            {
             method: "POST",
             body: formData,
            }
            );
            const data = await results.json();
           
            if (!data.success) {
             return NextResponse.json(
             { success: false, error: "Bot detected" },
            { status: 403 }
            );
            }

const tmdbData = await fetchTMDB(
  Tmdb_Id,
  Type,
  Season,
  Episode,
  TMDB_API_KEY
);

const [result, tmdb] = await Promise.all([
  utill(
    tmdbData.tmdbId,
    Type,
    Season,
    Episode,
    Server,
    tmdbData.title
  ),
  Promise.resolve(tmdbData),
]);
        return NextResponse.json({ ...result, ...tmdb })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'An error occurred while fetching data.' }, { status: 500 })
    }
}
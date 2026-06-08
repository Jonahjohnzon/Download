const BASE_URL = "https://trendimovies.com/"
const HEADERS = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150 Safari/537.36',
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: BASE_URL,
    Origin: BASE_URL
};

const buildUrl = (media) =>{
       let itemId;
    if (media.Type === 'tv') {
        itemId = `${BASE_URL}/${media.Type}/${media.Tmdb_Id}`;
    } else {
        itemId = `${BASE_URL}/${media.Type}/${media.Tmdb_Id}`;
    }

    return itemId
}






function parseTrendiSources(rawArray, media) {
  const { Type, Season, Episode } = media;
  const fullText = rawArray.join('');
  const decoded = fullText.replace(/&quot;/g, '"').replace(/&amp;/g, '&');

  let slicedDecoded = decoded;

  if (Type === 'tv' && Season != null && Episode != null) {
    const seasonPattern = new RegExp(
      `"${Season}":\\[1,\\[.*?"id":\\[0,(\\d+)\\],"episode_number":\\[0,${Episode}\\]`,
      's'
    );
    const seasonMatch = decoded.match(seasonPattern);
    if (!seasonMatch) return { sources: [], subtitleUrl: null };

    const targetContentId = seasonMatch[1];
    const blockStart = decoded.indexOf(`"${targetContentId}":[1,[`);
    if (blockStart === -1) return { sources: [], subtitleUrl: null };

    const closingPattern = /\]\]\]/g;
    closingPattern.lastIndex = blockStart;
    const closingMatch = closingPattern.exec(decoded);
    slicedDecoded = decoded.slice(blockStart, closingMatch ? closingMatch.index + 3 : decoded.length);
  }

  // Find all entry objects — each has quality, file_size, then url
  const entryPattern = /"quality":\[0,"([^"]+)"\],"file_size":\[0,"([^"]+)"\],"url":\[0,"(https:\/\/[^"]+)"\]/g;
  const fileNameMatches = [...slicedDecoded.matchAll(/"file_name":\[0,"([^"]+)"/g)];
  const urlMatches = [...slicedDecoded.matchAll(/https:\/\/[^\s"]+\/tgstream\/stream\/\d+/g)];

  const sources = [];
  for (const match of slicedDecoded.matchAll(entryPattern)) {
    const [, quality, size, url] = match;
    const variantMatch = slicedDecoded
      .slice(match.index, match.index + match[0].length + 200)
      .match(/"variant":\[0,(?:"([^"]+)"|null)\]/);

    sources.push({
      url,
      quality,
      size,
      variant: variantMatch?.[1] ?? null,
    });
  }
  const qualityOrder = { '2160p': 0, '1080p': 1, '720p': 2, '480p': 3, '360p': 4, 'hdrip': 5 };

sources.sort((a, b) => 
  (qualityOrder[a.quality] ?? 99) - (qualityOrder[b.quality] ?? 99)
);

  const subtitleUrl = fileNameMatches.length > 0
    ? urlMatches[urlMatches.length - 1]?.[0] ?? null
    : null;

  return { sources, subtitleUrl };
}
// ─── Map to your source format ───────────────────────────────────────────────





const getSource = async  (media) =>{
    try{
    const url = buildUrl(media)
    
    const res = await fetch(url,{
        headers:HEADERS
    })
   
    const html = await res.text()
   
const { sources: parsed, subtitleUrl } = parseTrendiSources([html],media);

const sources = parsed.map(s => ({
  url:   s.url,
  size: s.size,
  type:    'mp4',
  quality: s.quality,   // "720p", "2160p", "hdrip" etc.
  label:    s.quality,
  audioTracks: [{ language: 'eng', label: 'English' }],
  provider: { id:"Screenopps", name: "Screenopps" },
}));



const subtitles = subtitleUrl
  ? [{ url: subtitleUrl, language: 'en', label: 'English' }]
  :  [] // fallback to your existing fetcher

return { sources, subtitles, diagnostics: [] };
    
    }catch(err){
    console.log(err)
  }
}

export const novaProvider = (media) =>{
   return getSource(media)
}
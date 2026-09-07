const BASE_URL = "https://fzmovies.host";

const HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/150 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: BASE_URL + "/",
};

/**
 * Make an absolute FZMovies URL
 */
const absoluteUrl = (url) => {
    if (!url) return null;

    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    return `${BASE_URL}/${url.replace(/^\/+/, "")}`;
};


/**
 * Search FZMovies
 */
const searchFzMovies = async (title) => {
    // First load homepage so we can get the search form/session
    const homeRes = await fetch(`${BASE_URL}/`, {
        headers: HEADERS,
    });

    if (!homeRes.ok) {
        throw new Error(`FZMovies homepage: ${homeRes.status}`);
    }

    const html = await homeRes.text();

    // Find the search form
    const formMatch = html.match(
        /<form[^>]*>([\s\S]*?)<\/form>/i
    );

    if (!formMatch) {
        throw new Error("FZMovies search form not found");
    }

    const formHtml = formMatch[1];

    // Get form action
    const actionMatch = formMatch[0].match(
        /action=["']([^"']*)["']/i
    );

    const action = actionMatch?.[1] || "/";

    const searchUrl = absoluteUrl(action);

    /*
     * Python equivalent:
     *
     * br.select_form(nr=0)
     * br.form['searchname'] = query
     * br.submit()
     */

    const body = new URLSearchParams();
    body.set("searchname", title);

    const searchRes = await fetch(searchUrl, {
        method: "POST",
        headers: {
            ...HEADERS,
            "Content-Type":
                "application/x-www-form-urlencoded",
        },
        body: body.toString(),
    });

    if (!searchRes.ok) {
        throw new Error(
            `FZMovies search: ${searchRes.status}`
        );
    }

    const searchHtml = await searchRes.text();

    return parseSearchResults(searchHtml);
};


/**
 * Parse search results
 *
 * Equivalent to:
 *
 * soup.find_all("div", {"class": "mainbox"})
 */
const parseSearchResults = (html) => {
    const results = [];

    const mainboxes = html.match(
        /<div[^>]*class=["'][^"']*\bmainbox\b[^"']*["'][^>]*>[\s\S]*?<\/div>/gi
    ) || [];

    for (const box of mainboxes) {
        const links = [];

        const linkMatches = [
            ...box.matchAll(
                /<a[^>]+href=["']([^"']+)["'][^>]*>/gi
            ),
        ];

        for (const match of linkMatches) {
            const href = match[1];

            if (
                href &&
                href !== "" &&
                !href.includes("movietags")
            ) {
                links.push(href);
            }
        }

        const uniqueLinks = [...new Set(links)];

        if (!uniqueLinks.length) continue;

        // Extract visible text
        const text = box
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/gi, " ")
            .replace(/&amp;/gi, "&")
            .replace(/&quot;/gi, '"')
            .replace(/\s+/g, " ")
            .trim();

        results.push({
            url: absoluteUrl(uniqueLinks[0]),
            text,
        });
    }

    /*
     * The Python version gets:
     *
     * ident[1] = title
     * ident[3] = year
     * ident[5] = quality
     *
     * FZMovies markup can vary, so try to extract
     * the useful information more safely.
     */

    return results.slice(0, 5).map((result) => {
        const text = result.text;

        const yearMatch = text.match(
            /\b(19|20)\d{2}\b/
        );

        const qualityMatch = text.match(
            /\b(2160p|1080p|720p|480p|360p|HDRip|WEBRip|BluRay|HDTS|CAM)\b/i
        );

        return {
            url: result.url,
            title: text,
            year: yearMatch?.[0] || "Unknown",
            quality: qualityMatch?.[0] || "Unknown",
        };
    });
};




/**
 * Get final download URL
 */

const getSource = async (media) => {
    try {
        const title = media?.Title;

        if (!title) {
            return {
                sources: [],
                subtitles: [],
                diagnostics: [{ message: "No movie title supplied" }]
            };
        }

        // =========================
        // 1. SEARCH
        // =========================

        const results = await searchFzMovies(title);

        if (!results.length) {
            return {
                sources: [],
                subtitles: [],
                diagnostics: [{ message: "No FZMovies results found" }]
            };
        }

        // First search result
        const selected = results[0];

        // =========================
        // 2. OPEN MOVIE PAGE
        // =========================

        const response = await fetch(selected.url, {
            headers: {
                ...HEADERS,
                Referer: `${BASE_URL}/`
            }
        });

        if (!response.ok) {
            throw new Error(
                `FZMovies movie page: ${response.status}`
            );
        }

        const html = await response.text();

        // =========================
        // 3. GET DOWNLOAD OPTIONS
        // =========================

        const options = [];

            const moviesFilesMatches = [
                ...html.matchAll(
                    /<ul[^>]*class=["'][^"']*\bmoviesfiles\b[^"']*["'][^>]*>([\s\S]*?)<\/ul>/gi
                )
            ];

            for (const ul of moviesFilesMatches) {
                const links = [
                    ...ul[1].matchAll(
                        /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
                    )
                ];

                for (const match of links) {
                    const href = match[1];

                    if (!href || href.includes("mediainfo.php")) {
                        continue;
                    }

                    const linkText = match[2]
                        .replace(/<[^>]+>/g, " ")
                        .replace(/&nbsp;/gi, " ")
                        .replace(/&amp;/gi, "&")
                        .replace(/&quot;/gi, '"')
                        .trim()
                        .replace(/\s+/g, " ");

                    /*
                    * Example:
                    *
                    * The Shawshank Redemption BluRay 480p.mp4
                    * (379 MB) {108835 hits}
                    */

                    const qualityMatch = linkText.match(
                        /\b(2160p|1080p|720p|480p|360p|4K|HD|BluRay|HDRip)\b/i
                    );

                    const sizeMatch = linkText.match(
                        /\(([\d.,]+\s*(?:KB|MB|GB|TB))\)/i
                    );

                    // Remove size/hits information from displayed filename
                    const filename = linkText
                        .replace(
                            /\([\d.,]+\s*(?:KB|MB|GB|TB)\)/gi,
                            ""
                        )
                        .replace(
                            /\{[\d,]+\s*hits?\}/gi,
                            ""
                        )
                        .trim();

                    options.push({
                        url: absoluteUrl(href),
                        title: filename,
                        quality: qualityMatch?.[0] || "Unknown",
                        size: sizeMatch?.[1] || "Unknown"
                    });
                }
            }

        if (!options.length) {
            return {
                sources: [],
                subtitles: [],
                diagnostics: [
                    {
                        message:
                            "No download options found on FZMovies"
                    }
                ]
            };
        }


        // =========================
        // 4. RETURN THESE FIRST
        // =========================

        const sources = options.map((option, index) => ({
                url: option.url,
                type: "link",

                quality: option.quality,
                label: option.title,
                size: option.size,

                audioTracks: [
                    {
                        language: "eng",
                        label: "English"
                    }
                ],

                provider: {
                    id: "FZMovies",
                    name: "FZMovies"
                },

                isDownloadPage: true,
                index: index + 1
            }));

        return {
            sources,
            subtitles: [],
            diagnostics: []
        };

    } catch (err) {

        console.error("[FZMovies]", err);

        return {
            sources: [],
            subtitles: [],
            diagnostics: [
                {
                    message: err.message
                }
            ]
        };
    }
};

/**
 * Provider export
 */
export const fzProvider = (media) => {
    return getSource(media);
};
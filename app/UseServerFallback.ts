import { ListServer } from './Player/ListServers'
import { store } from '@/app/store'
import { GetMovieFetch } from './Get/GetMovie'

interface MediaParams {
    paramId: string
    Type: 'movie' | 'tv'
    Season?: string
    Episode?: string
    token?: string
}

export const ServerFallback = async (params: MediaParams): Promise<boolean> => {
    store.loading = true

    const server = ListServer[0].name

    try {
        const response = params.Type === 'movie'
            ? await GetMovieFetch({ Tmdb_Id: params.paramId, Type: 'movie', Server: server, token: params.token })
            : await GetMovieFetch({ Tmdb_Id: params.paramId, Type: 'tv', Season: params.Season, Episode: params.Episode, Server: server, token: params.token })

        if (response.error || !response.sources?.length) {
            store.title = response?.title || ""
            store.poster = response?.poster || ""
            store.loading = false
            store.token = true
            return false
        }

        store.ParamId = params.paramId
        store.Type = params.Type
        store.ServerinUse = server
        store.mainType = response.sources[0]
        store.sources = response.sources
        store.subtitles = response.subtitles
        store.M3u8Url = response.sources[0]?.url || ''
        store.title = response.title
        store.poster = response.poster
        store.backdrop = response.backdrop
        store.overview = response.overview
        store.loading = false
        store.token = true
        return true

    } catch {
        store.loading = false
        store.token = true
        return false
    }
}
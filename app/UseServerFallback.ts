// hooks/useServerFallback.ts

import { store } from '@/app/store'
import { GetMovieFetch } from './Get/GetMovie'



interface MediaParams {
    paramId: string
    Type: 'movie' | 'tv'
    Season?: string
    Episode?: string
}

export const ServerFallback = async (server: string, params: MediaParams): Promise<boolean> => {

        try {
           
            store.loading = true
            const response = params.Type === 'movie'
                ? await GetMovieFetch({ Tmdb_Id: params.paramId, Type: 'movie', Server: server })
                : await GetMovieFetch({ Tmdb_Id: params.paramId, Type: 'tv', Season: params.Season, Episode: params.Episode, Server: server })
           
            if (response.error || !response.sources?.length)
            {
                store.title = response?.title || ""
                store.poster = response?.poster || ""
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
            return true
        } catch {
            return false
        }
    
}
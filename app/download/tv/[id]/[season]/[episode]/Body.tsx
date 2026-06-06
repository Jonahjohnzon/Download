"use client"
import Player from '@/app/Player/Player'
import  { useEffect } from 'react'
import { store } from '@/app/store'
import { useServerFallback } from '../../../../../UseServerFallback'
import { ListServer } from '../../../../../Player/ListServers'
import { useSnapshot } from 'valtio/react'

const Body = ({ paramId, season, episode }: { paramId: string; season: string; episode: string }) => {   
    const Store = useSnapshot(store);
    const loading = Store.loading 
    const GetData = () => {
        store.Season = season
        store.Episode = episode

    const result = useServerFallback(ListServer[0].name, { paramId, Type: 'tv', Season: season, Episode: episode })  
       if (!result) {
        // Handle failure (e.g., show error message or try next server) 
        store.loading = false
       }
    }


    useEffect(() => {
        GetData()
    }, [])

    if (loading) return <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin">

    </div>


    return <Player />
}

export default Body
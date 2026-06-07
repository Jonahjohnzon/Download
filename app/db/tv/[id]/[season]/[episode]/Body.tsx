"use client"
import Player from '@/app/Player/Player'
import  { useEffect } from 'react'
import { store } from '@/app/store'
import { ServerFallback } from '../../../../../UseServerFallback'
import { ListServer } from '../../../../../Player/ListServers'
import { useSnapshot } from 'valtio/react'
import Loading from '@/app/Player/Loading'

const Body = ({ paramId, season, episode }: { paramId: string; season: string; episode: string }) => {   
    const Store = useSnapshot(store);
    const loading = Store.loading 
    const token = Store.token
    const GetData = async () => {
           if(!token) return;
        store.loading = true
        store.Season = season
        store.Episode = episode

    const result = await ServerFallback(ListServer[0].name, { paramId, Type: 'tv', Season: season, Episode: episode }) 
  
       if (!result) {
        // Handle failure (e.g., show error message or try next server) 
        store.loading = false
       }
    }


    useEffect(() => {
        GetData()
    }, [token])

    if(!token) return <Loading/>

    if (loading) return <div className=' bg-black w-full h-screen flex justify-center items-center overflow-hidden'> <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin"></div></div>

  


    return <Player />
}

export default Body
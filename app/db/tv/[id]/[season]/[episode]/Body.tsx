"use client"
import Player from '@/app/Player/Player'
import  { useEffect } from 'react'
import { store } from '@/app/store'

import { useSnapshot } from 'valtio/react'
import Loading from '@/app/Player/Loading'

const Body = ({ paramId, season, episode }: { paramId: string; season: string; episode: string }) => {   
    const Store = useSnapshot(store);
    const loading = Store.loading 
    const token = Store.token

  
    useEffect(() => {
    store.Season = season
    store.Episode = episode
    store.ParamId = paramId
    store.Type = 'tv'
    }, [])

    if(!token) return <Loading/>

    if (loading) return <div className=' bg-black w-full h-screen flex justify-center items-center overflow-hidden'> <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin"></div></div>

    return <Player />
}

export default Body
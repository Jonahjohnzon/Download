// Body.tsx
"use client"
import Player from '@/app/Player/Player'
import  { useEffect } from 'react'
import { store } from '@/app/store'
import { useServerFallback } from '../../../UseServerFallback'
import {ListServer} from '../../../Player/ListServers'
import { useSnapshot } from 'valtio/react'

const Body = ({ paramId }: { paramId: string }) => {
    const Store = useSnapshot(store);
    const loading = Store.loading

    const GetData =  () => {
       const result = useServerFallback(ListServer[0].id, { paramId, Type: 'movie' })
         if (!result) { 
            console.error("Failed to fetch data for movie with ID:", paramId);
             store.loading = false
         }
        }


    useEffect(() => {
      GetData()
    }, [])

    if (loading) return <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>

    
    return <Player />
}

export default Body
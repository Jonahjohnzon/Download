// Body.tsx
"use client"
import Player from '@/app/Player/Player'
import  { useEffect } from 'react'
import { store } from '@/app/store'
import { ServerFallback } from '../../../UseServerFallback'
import {ListServer} from '../../../Player/ListServers'
import { useSnapshot } from 'valtio/react'

const Body = ({ paramId }: { paramId: string }) => {
    const Store = useSnapshot(store);
    const loading = Store.loading

    const GetData = async () => {
       const result = await ServerFallback(ListServer[0].id, { paramId, Type: 'movie' })
         if (!result) { 
             store.loading = false
         }
        }


    useEffect(() => {
      GetData()
    }, [])

    if (loading) return <div className=' bg-black w-full h-screen flex justify-center items-center'> <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin"></div></div>

    
    return <Player />
}

export default Body
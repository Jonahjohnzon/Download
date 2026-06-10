// Body.tsx
"use client"
import Player from '@/app/Player/Player'
import  { useEffect } from 'react'
import { store } from '@/app/store'
import { useSnapshot } from 'valtio/react'
import Loading from '@/app/Player/Loading'

const Body = ({ paramId }: { paramId: string}) => {
    const Store = useSnapshot(store);
    const loading = Store.loading
    const token = Store.token


useEffect(()=>{
    store.ParamId = paramId
    store.Type = 'movie'
},[])

   

    if(!token) return <Loading/>

    if (loading) return <div className=' bg-black w-full h-screen flex justify-center items-center overflow-hidden'> <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin"></div></div>

    
    return <Player />
}

export default Body
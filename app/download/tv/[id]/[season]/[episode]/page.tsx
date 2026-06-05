import React from 'react'
import Body from './Body'

const page = async ({params}:{params:{id:string, season:string, episode:string}}) => {
  
  const paramId = await params
  const id = paramId.id
  const season = paramId.season
  const episode = paramId.episode
  return (
    <Body paramId={id} season={season} episode={episode} />
  )
}

export default page
import React from 'react'
import Body from './Body'

const page = async ({params}:{params:{id:string}}) => {
  
  const paramId = await params
  const id = paramId.id
  return (
    <Body paramId={id} />
  )
}

export default page
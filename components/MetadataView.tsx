// "use client"

import React from 'react'
import { Button } from './ui/button';

const MetadataItems = ({item, value}:{item:string;value:string})=>{
    return <div className='flex gap-2'>
        <p>{item}:</p>
        <p>{value}</p>
    </div>
}

const MetadataView = ({activateUpdate}:{activateUpdate:any}) => {
    const updateMetadata = ()=>{
        console.log('Clicked...')
        activateUpdate('metadata-out')
    }
  return (
    <div className='flex flex-col justify-center max-h-100 gap-5'>
     <MetadataItems item='companyName' value='DecoyCompanyName' />
     <MetadataItems item='companyAddress' value='DecoyCompanyNameAddress' />
     <MetadataItems item='InspectionType' value='DecoyInspectionType' />

     <Button 
        className='bg-brand form-submit-button'
        onClick = {()=>{updateMetadata()}}
        >
            Update
        </Button>
    </div>
  )
}

export default MetadataView
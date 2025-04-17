"use client"

import React, { useState } from 'react'
import { Button } from './ui/button';
import {ImageThumbnail} from './ActionsModalContent'
import {DetailRow} from './ActionsModalContent'
import { Models } from 'node-appwrite';
import { Divide } from 'lucide-react';
import Link from 'next/link';



const MetadataItems = ({item, value}:{item:string;value:string})=>{
    return <div className='flex gap-2'>
        <p>{item}:</p>
        <p>{value}</p>
    </div>
}

const MetadataView = ({setInputMetadata, setBlankMetadataForms, inputMetadata, file}:{setInputMetadata:any;setBlankMetadataForms:any; inputMetadata:boolean; file:Models.Document}) => {
    const [hideMetadataView, setHideMetadataView] =  useState(false);
    const updateMetadata = ()=>{
        console.log('Clicked...')
        setInputMetadata(true)
        setHideMetadataView(!hideMetadataView)
        setBlankMetadataForms(true);
    }
    return (
       <>

            {!hideMetadataView? 
            <div>
                <ImageThumbnail file={file} />
                <div className='space-y-4 px-2 pt-2'>
                <DetailRow label="Name of Company" value={file.name}/>
                <DetailRow label="Address" value={file.CompanyAddress[0]}/>
                <DetailRow label="State" value={file.CompanyAddress[0]}/>
                <DetailRow label="Inspection Type" value={file.CompanyAddress[0]}/>
                <DetailRow label="Lead Inspector" value={file.CompanyAddress[0]}/>
                </div>
                <Button 
                className='bg-brand w-full mt-4 rounded-2xl'
                onClick = {()=>{updateMetadata()}}
                >
                Update
                </Button>
            </div>:
            <div>
                <Link href={'/documelnts'}>
                    <ImageThumbnail file={file} />
                </Link>
            </div>}
        </>
      )
}

export default MetadataView
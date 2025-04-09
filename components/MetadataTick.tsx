"use client"
import Image from 'next/image'
import { Models } from 'node-appwrite'
import React, { useState } from 'react'
import { useFileTickContext} from './context';


const MetadataTick = ({file}:{file:Models.Document}) => {
    const [fileTick, setFileTick] = useState(false);
    const { metaDataTick } = useFileTickContext();
    console.log(file.name, file.CompanyAddressIds.length);
    // file.CompanyAddressIds.length=0;
  return (
    <div>
        {/* {(file.CompanyAddressIds.length >0) && <Image  */}
        { (metaDataTick || file.CompanyAddressIds.length>0) && <Image 
              src='/assets/icons/metadata-checked.png' 
              width={24}
              height={24}
              alt='metadata-tick'
              className='absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 transition-opacity duration-1000 ${
                  visible ? "opacity-100" : "opacity-0"}`'
            />}
    </div>
  )
}

export default MetadataTick
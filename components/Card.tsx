import Link from 'next/link'
import { Models } from 'node-appwrite'
import React from 'react'
import Thumbnail from './Thumbnail'
import { cn, convertFileSize } from '@/lib/utils'
import FormattedDateTime from './FormattedDateTime'
import ActionDropdown from './ActionDropdown'
import Image from 'next/image'
import MetadataTick from './MetadataTick'
import { AppProvider} from './context'


const Card = ({file}:{file:Models.Document}) => {
  
  console.log(file.extension)
  
  return (
    <AppProvider>
      <div className={cn(`p-1 relative ${file.extension=== 'docx' ? 'bg-gray-400':'bg-yellow-100'}`)}> 
      {/* //check for prsence of metadata, and use it in the color coding. */}
      <MetadataTick file={file} />
      <Link href={file.url} target="_blank" className='file-card'>{file.name}
        <div className='flex justify-between'>
          <Thumbnail 
            type={file.type}
            extension={file.extension}
            url={file.url}
            className='!size-20'
            imageClassName='!size-11'
            />

          <div className='flex flex-col items-end justify-between'>
            <ActionDropdown file={file} />
            <p className='body-1'>{convertFileSize(file.size)}</p>
          </div>
        </div>

        <div className='file-card-details'>
          <p className='subtitle-2 line-clamp-1'>{file.name}</p>
          <FormattedDateTime date = {file.$createdAt} className="body-2 text-light-100" />
          <p className='caption line-clamp-1 text-light-200'>By: {file.owner.fullName}</p>
        </div>
      
      </Link>
      </div>
    </AppProvider>
  )
}

export default Card
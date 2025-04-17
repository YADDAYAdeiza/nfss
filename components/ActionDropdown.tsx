"use client"
import React, { useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import Image from 'next/image'
import { Models } from 'node-appwrite'
import { actionsDropdownItems } from '@/constants'
import { cn, constructDownloadUrl } from '@/lib/utils'
import Link from 'next/link'
import { set } from 'zod'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { usePathname } from 'next/navigation'
import { addMetaData, deleteFile, renameFile, updateFileUsers } from '@/lib/actions/file.actions'
import { FileDetails, ShareInput} from './ActionsModalContent'
import MetadataUpdateForm from './MetadataUpdateForm'
import MetadataView from './MetadataView'
import MetadataForm from './MetadataForm'



const ActionDropdown = ({file}:{file:Models.Document}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropDownOpen, setIsDropDownOpen] = useState(false);
    const [action, setAction] = useState<ActionType | null>(null)
    const [name,setName] = useState(file.name);
    const [isLoading, setIsLoading] = useState(false);
    const path = usePathname();
    const [emails, setEmails] = useState<string[]>([]);
    const [inputMetadata, setInputMetadata] = useState(false);
    const [blankMetadataForms, setBlankMetadataForms] = useState(false);

// console.log('This is blankMetadataForms: ', blankMetadataForms);
    const closeAllModals = ()=>{
        setIsModalOpen(false);
        setIsDropDownOpen(false);
        setAction(null);
        setName(file.name)
        // console.log('This is inputMetadata: ', inputMetadata)

    }

    const handleAction = async ()=>{
        if (!action) return;
        setIsLoading(true)
        let success = false;

        const actions = {
            rename:()=>renameFile({fileId:file.$id, name, extension:file.extension, path}),
            share:()=>updateFileUsers({fileId:file.$id, emails, path }),
            delete:() => deleteFile({fileId:file.$id, path, bucketFileId:file.bucketFileId}),
            metadata:()=>addMetaData({fileId:file.$id, path})
        }

        success = await actions[action.value as keyof typeof actions]();

        console.log('-----');

        console.log('This is success')

        console.log(success)
        if (success) closeAllModals()
        
        setIsLoading(false);
    }

    const handleRemoveUser = async(email:string)=>{
        const updatedEmails = emails.filter((e)=> e!==email);

        const success = await updateFileUsers({
            fileId:file.$id,
            emails:updatedEmails,
            path,
        })

        if (success) setEmails(updatedEmails);
        closeAllModals();
    };

    const renderDialogContent = ()=>{
        if (!action) return null;

        const {value, label} = action;
        return (
        <DialogContent className='shad-dialog button'>
            <DialogHeader className='flex flex-col gap-3'>
            <DialogTitle className='text-center text-light-100'>
                {label}
            </DialogTitle>
                {value==="rename" &&
                (<Input
                type ='text'
                value={name}
                onChange={(e)=>setName(e.target.value)}
                />)}
                {value ===  'details' && <FileDetails file={file} />}
                {value === 'share'  && (
                    <ShareInput file={file} onInputChange={setEmails} onRemove={handleRemoveUser}/>
                )}
                {value === 'delete' && (
                    <p className='delete-confirmation'>
                        Are you sure you want to delete { ` `}
                        <span className='delete-file-name'>{file.name}</span>
                    </p>
                )}
                {((file.CompanyAddressIds.length >0 && value === 'metadata') ? <MetadataView setInputMetadata={setInputMetadata} setBlankMetadataForms={setBlankMetadataForms} inputMetadata={inputMetadata} file={file}/>: blankMetadataForms?<div></div>:<MetadataForm type='metadata-in' fileId = {file.$id} setInputMetadata={setInputMetadata} inputMetadata ={inputMetadata} file={file} closeAllModals = {closeAllModals}/>)}
                {/* {!inputMetadata?((file.CompanyAddressIds.length >0 && value === 'metadata') ? <MetadataView setInputMetadata={setInputMetadata} inputMetadata={inputMetadata} file={file}/>: <MetadataForm type='metadata-in' fileId = {file.$id} inputMetadata={inputMetadata} file={file} closeAllModals = {closeAllModals}/>):<div></div>} */}
                {inputMetadata ?<MetadataUpdateForm type='metadata-in' fileId = {file.$id} file={file} closeAllModals = {closeAllModals} setInputMetadata={setInputMetadata} inputMetadata={inputMetadata}/>:<div></div>}
                {/* {inputMetadata && <div></div>} */}

            </DialogHeader>
            {["rename", "delete", "share"].includes(value)&&(
                <DialogFooter className='flex flex-col gap-3 md:flex-row'>
                    <Button onClick={closeAllModals}
                        className='modal-cancel-button'>
                        Cancel
                    </Button>
                    <Button onClick = {handleAction} className='modal-submit-button'>
                        <p className='capitalize'>{value}</p>
                   {isLoading && (
                   <Image 
                        src="/assets/icoins/loader.svg"
                        alt="loader"
                        width={24}
                        height={24}
                        className='animate-spin'
                   /> )}
                    </Button>

                </DialogFooter>
                
            )}
        </DialogContent>
        )
    };
  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DropdownMenu open={isDropDownOpen} onOpenChange={setIsDropDownOpen}>
        <DropdownMenuTrigger className='shad-no-focus'>
            <Image 
                src="/assets/icons/dots.svg"
                alt="dots"
                width={34}
                height={34}
                />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuLabel className='max-w-[200px] truncate'>{file.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {actionsDropdownItems.map((actionItem)=>(
                <DropdownMenuItem
                key={actionItem.value}
                className='shad-no-focus'
                onClick={()=>{
                    setAction(actionItem)
                    if(
                        ["rename", "share", "delete", "details", "metadata"].includes(actionItem.value)
                    ){
                        setIsModalOpen(true)
                    }
                }}>
                        {actionItem.value === 'download' ? <Link 
                            href = {constructDownloadUrl(file.bucketFileId)}
                            download={file.name}
                            className="flex items-center gap-2"
                            > 
                            <Image
                                src={actionItem.icon}
                                alt={actionItem.label}
                                width={30}
                                height={30}
                                />
                            {actionItem.label}
                        </Link>:
                        <div 
                        className="flex items-center gap-2"
                        > 
                            <Image
                                src={actionItem.icon}
                                alt={actionItem.label}
                                width={30}
                                height={30}
                                />
                            {actionItem.label}
                        </div>
                    }
                </DropdownMenuItem>
            ))}
<DropdownMenuLabel className='max-w-[200px] truncate'>{file.$id}</DropdownMenuLabel>
        </DropdownMenuContent>
        </DropdownMenu>
        {renderDialogContent()}
</Dialog>

  )
}

export default ActionDropdown
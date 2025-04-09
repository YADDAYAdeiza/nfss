"use client"

import React, { useState } from 'react'
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from './ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { createAccount, createMetada, signInUser, updateMetadata } from '@/lib/actions/user.actions'
import OTPModal from './OTPModal'
import MetadataView from './MetadataView'
import { updateFileMetadata } from '@/lib/actions/file.actions'
import { usePathname } from 'next/navigation'
import { useFileTickContext } from './context' ;


type FormType = "metadata-in"  | "metadata-out";

const authFormSchema = (formType:FormType)=>{
  return z.object({
    companyName:z.string().min(2).max(50),
    companyAddress:z.string(),
    state:z.string(),
    companyEmail:z.string().email(),
    phoneNo:z.string().max(11),
    latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional(),
  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional(),
    inspectionType:z.string(),
    inspectedProductLine:z.string(),
    gmpStatus:z.string(),
    inspectors:z.string(),
  })
}

const MetadataForm = ({ type, fileId, closeAllModals }:{ type:FormType;fileId:string, closeAllModals:any}) => {

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [accountId, setAccountId] = useState(null)
  const [metadataType, setMetadataType] = useState('metadata-in')
  const [fileMetadataSet, setFileMetadataSet] = useState(false);
  const { setMetaDataTick } = useFileTickContext()
  const formSchema = authFormSchema(type);
  const path = usePathname();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName:"", companyAddress:"" , companyEmail:"",phoneNo:"" , state:"", latitude:0, longitude:0, inspectionType:"", inspectedProductLine:""
    },
  })
 
  // 2. Define a submit handler.
  const onSubmit= async (values: z.infer<typeof formSchema>)=> {
    setIsLoading(true);
    setErrorMessage("")
    
    try {
      const fileDocument = (type === metadataType) && await updateFileMetadata({
        fileId:fileId,
        companyName:values.companyName,
        companyAddress:values.companyAddress,
        state:values.state,
        companyEmail:values.companyEmail, 
        phoneNo:values.phoneNo,
        latitude:values.latitude,
        longitude:values.longitude,
        inspectionType:values.inspectionType,
        inspectedProductLine:values.inspectedProductLine,
        gmpStatus:values.gmpStatus,
        inspectors:values.inspectors,
        path})
        .then(fileDocument=>{
          console.log('This is file Document', fileDocument)
          console.log('This is user:', fileDocument);
          console.log(fileDocument.CompanyAddress.includes(values.companyAddress))
          setFileMetadataSet(fileDocument.CompanyAddress.includes(values.companyAddress));
          // setFileMetadataSet(fileDocument.CompanyAddressIds.includes(fileId));
          setMetaDataTick(fileDocument.CompanyAddress.includes(values.companyAddress))
          // setMetaDataTick(fileDocument.CompanyAddressIds.includes(fileId))
          // console.log(fileDocument)
        });


        closeAllModals();
      // setAccountId(user.accountId)
    }catch{
      setErrorMessage('Failed to create account.  Please try again.')
    }finally{
      setIsLoading(false);
    }

  }

  return (
    <>
  {type === metadataType?
  <Form {...form}>
    <div className="max-h-96 overflow-y-auto border-none p-4">
      <form onSubmit={form.handleSubmit(onSubmit)} className="metadata-form">
        <h1 className='metadata-form-title'>{type === metadataType? "Input Metadata" : "Metadata"}
          <br/>
          <span className='text-brand text-sm font-semibold'>{type === metadataType?"(You don't have metadata yet)":"Update metadata"}</span>
        </h1>
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <div className='shad-form-item'>
                <FormLabel className='shad-form-label'>Company Name</FormLabel>
                <FormControl>
                 {type === metadataType? <Input placeholder="Enter Company Name" className='shad-input' {...field}/>: <p>Something</p> }
                </FormControl>
              </div>
              <FormMessage className='shad-form-message' />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="companyAddress"
          render={({ field }) => (
            <FormItem>
              <div className='shad-form-item'>
                <FormLabel className='shad-form-label'>Company Address</FormLabel>
                <FormControl>
                 {type === metadataType?  <Input placeholder="Enter your full email" className='shad-input' {...field} />: <p>Some Address</p>}
                </FormControl>
              </div>
              <FormMessage className='shad-form-message' />
            </FormItem> 
          )}
        />
        <FormField
          control={form.control}
          name="companyEmail"
          render={({ field }) => (
            <FormItem>
              <div className='shad-form-item'>
                <FormLabel className='shad-form-label'>Company Email</FormLabel>
                <FormControl>
                  {type === metadataType? <Input placeholder="Enter your full email" className='shad-input' {...field} />: <p>Some Email</p>}
                </FormControl>
              </div>
              <FormMessage className='shad-form-message' />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="phoneNo"
          render={({ field }) => (
            <FormItem>
              <div className='shad-form-item'>
                <FormLabel className='shad-form-label'>Phone number</FormLabel>
                <FormControl>
                  {type === metadataType? <Input placeholder="Enter phone number" className='shad-input' {...field} />: <p>Some phone number</p>}
                </FormControl>
              </div>
              <FormMessage className='shad-form-message' />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <div className='shad-form-item'>
                <FormLabel className='shad-form-label'>State</FormLabel>
                <FormControl>
                  {type === metadataType? <Input placeholder="Enter state" className='shad-input' {...field} />: <p>Some State</p>}
                </FormControl>
              </div>
              <FormMessage className='shad-form-message' />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="latitude"
          render={({ field }) => (
            <FormItem>
              <div className='shad-form-item'>
                <FormLabel className='shad-form-label'>Latitude</FormLabel>
                <FormControl>
                 {type === metadataType?  <Input placeholder="Enter Company Name" className='shad-input' {...field} />: <p>0.00000</p>}
                </FormControl>
              </div>
              <FormMessage className='shad-form-message' />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="longitude"
          render={({ field }) => (
            <FormItem>
              <div className='shad-form-item'>
                <FormLabel className='shad-form-label'>longitude</FormLabel>
                <FormControl>
                 {type === metadataType? <Input placeholder="Enter Company Name" className='shad-input' {...field} />: <p>0.0000000</p>}
                </FormControl>
              </div>
              <FormMessage className='shad-form-message' />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="inspectionType"
          render={({ field }) => (
            <FormItem>
              <div className='shad-form-item'>
                <FormLabel className='shad-form-label'>Inspection Type</FormLabel>
                <FormControl>
                 {type === metadataType?<Input placeholder="Enter Company Name" className='shad-input' {...field} />: <p>Inspection Type</p>}
                </FormControl>
              </div>
              <FormMessage className='shad-form-message' />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="inspectedProductLine"
          render={({ field }) => (
            <FormItem>
              <div className='shad-form-item'>
                <FormLabel className='shad-form-label'>Product Line</FormLabel>
                <FormControl>
                {type === metadataType? <Input placeholder="Enter Product Line" className='shad-input' {...field} />: <p>An Inspected Product Line</p>}
                </FormControl>
              </div>
              <FormMessage className='shad-form-message' />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gmpStatus"
          render={({ field }) => (
            <FormItem>
              <div className='shad-form-item'>
                <FormLabel className='shad-form-label'>GMP Status</FormLabel>
                <FormControl>
                 {type === metadataType? <Input placeholder="Enter Risk Level" className='shad-input' {...field} />: <p>GMP Status</p>}
                </FormControl>
              </div>
              <FormMessage className='shad-form-message' />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="inspectors"
          render={({ field }) => (
            <FormItem>
              <div className='shad-form-item'>
                <FormLabel className='shad-form-label'>Inspectors</FormLabel>
                <FormControl>
                {type === metadataType? <Input placeholder="Enter Company Name" className='shad-input' {...field} />: <p>Lead Inspector</p>}
                </FormControl>
              </div>
              <FormMessage className='shad-form-message' />
            </FormItem>
          )}
        />
       {type === metadataType?  <Button type="submit" className='form-submit-button' disabled={isLoading}>
          {type === metadataType ? "Submit": "update"}
          {isLoading && 
          <Image src="/assets/icons/loader.svg" alt="loader" width = {24} height={24} className = "ml-2 animate-spin" />}
        </Button>:null}

        {errorMessage&&<p className='error-message'>*{errorMessage}</p>}

          <div className='body-2 flex justify-center'>
            {/* <Link href={type==="sign-in"?"/sign-up":"sign-in"} className='ml-1 font-medium text-brand'>{type==="sign-in"?"Sign-Up":"Sign In"}</Link> */}
          </div>
      </form>
      </div>
    </Form>:
    <MetadataView activateUpdate = {setMetadataType}  />
    }
    {/* OTP Verification */}
    {accountId && <OTPModal email={form.getValues("companyEmail")} accountId={accountId} />}
    </>
  )
}

export default MetadataForm
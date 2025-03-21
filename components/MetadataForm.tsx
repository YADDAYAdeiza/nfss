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


type FormType = "metadata-in"  | "metadata-out";

const authFormSchema = (formType:FormType)=>{
  return z.object({
    companyName:z.string().min(2).max(50),
    companyAddress:z.string(),
    companyEmail:z.string().email(),
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

const MetadataForm = ({ type }:{ type:FormType }) => {

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [accountId, setAccountId] = useState(null)
  const [metadataType, setMetadataType] = useState('metadata-in')
  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName:"", companyAddress:"", latitude:0, longitude:0, inspectionType:"", inspectedProductLine:"", companyEmail:"", 
    },
  })
 
  // 2. Define a submit handler.
  const onSubmit= async (values: z.infer<typeof formSchema>)=> {
    setIsLoading(true);
    setErrorMessage("")
    
    try {
      const user = type === metadataType? await createMetada({companyName:values.companyName || "", companyEmail:values.companyEmail}):await updateMetadata({companyEmail:values.companyEmail});
      setAccountId(user.accountId)
    }catch{
      setErrorMessage('Failed to create account.  Please try again.')
    }finally{
      setIsLoading(false)
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
                 {type !== metadataType? <Input placeholder="Enter Company Name" className='shad-input' {...field}/>: <p>Something</p> }
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
                  <Input placeholder="Enter your full email" className='shad-input' {...field} />
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
                  <Input placeholder="Enter your full email" className='shad-input' {...field} />
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
                  <Input placeholder="Enter Company Name" className='shad-input' {...field} />
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
                  <Input placeholder="Enter Company Name" className='shad-input' {...field} />
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
                  <Input placeholder="Enter Company Name" className='shad-input' {...field} />
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
                  <Input placeholder="Enter Company Name" className='shad-input' {...field} />
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
                  <Input placeholder="Enter Company Name" className='shad-input' {...field} />
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
                  <Input placeholder="Enter Company Name" className='shad-input' {...field} />
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
                  <Input placeholder="Enter Company Name" className='shad-input' {...field} />
                </FormControl>
              </div>
              <FormMessage className='shad-form-message' />
            </FormItem>
          )}
        />
        <Button type="submit" className='form-submit-button' disabled={isLoading}>
          {type === metadataType ? "Submit": "update"}
          {isLoading && 
          <Image src="/assets/icons/loader.svg" alt="loader" width = {24} height={24} className = "ml-2 animate-spin" />}
        </Button>

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
"use client"

import React, { useState } from 'react'
import {useCallback} from 'react'
import {useDropzone} from 'react-dropzone'
import { Button } from './ui/button'
import Image from 'next/image'
import { cn, convertFileToUrl, getFileType } from '@/lib/utils'
import Thumbnail from './Thumbnail'
import { MAX_FILE_SIZE } from '@/constants'
import { toast } from "sonner"
import { usePathname } from 'next/navigation'
import { uploadFile } from '@/lib/actions/file.actions'

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { metadataSchema } from '@/app/schemas/metadataSchemas'
import { z } from "zod";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { Input } from './ui/input'
import { FormProvider } from "react-hook-form";
import { CompanyAndAddressMetadataCombobox } from './CompanyAndAddressMetadataCombobox'
import Trial from './Trial'


type Metadata = z.infer<typeof metadataSchema>;



interface Props {
  ownerId:string;
  accountId:string;
  className?:string;
}

   

const FileUploader = ({ ownerId, accountId, className }: Props) => { 
  // const {toast} = useToast()
  const path = usePathname();
  const [files, setFiles] = useState<File[]>([]);
  const [showMetadata, setShowMetadata] = useState(false);


    const form = useForm<Metadata>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      companyName: "",
      companyAddress: "",
      companyEmail:"",
      phoneNo:"",
      state:"",
      latitude: 0,
      longitude: 0,
      inspectionType: "",
      inspectedProductLine:"",
      gmpStatus:"",
      inspectors:"",
    },
  });

  const renderField = (
      name: keyof z.infer<typeof metadataSchema>,
      label: string,
      placeholder: string,
      defaultValue?: string
    ) => (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <div className="shad-form-item">
              <FormLabel className="shad-form-label">{label}</FormLabel>
              <FormControl>
                <Input
                  className="shad-input"
                  type={name === "latitude" || name === "longitude" ? "number" : "text"}
                  placeholder={placeholder}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
            </div>
            <FormMessage className="shad-form-message" />
          </FormItem>
        )}
      />
    );



const onDrop = useCallback(
  async (acceptedFiles: File[]) => {
    const metadata = form.getValues();

    const isValid = await form.trigger();
    if (!isValid) {
      toast("Please fill in all metadata fields.", {
        description: "Metadata is required before uploading.",
        duration: 3000
      });
      return;
    }

    const cleanMetadata = {
      ...metadata,
      latitude: parseFloat(metadata.latitude as any),
      longitude: parseFloat(metadata.longitude as any),
    };

    setFiles(acceptedFiles);

    const uploadPromises = acceptedFiles.map(async (file) => {
      if (file.size > MAX_FILE_SIZE) {
        setFiles((prev) => prev.filter((f) => f.name !== file.name));
        return toast("File Size Issues", {
          description: (
            <p className="bg-red p-4 rounded-2xl">
              <span className="font-semibold">{file.name}</span> is too large. Max file size is 50MB
            </p>
          ),
          action: {
            label: "Undo",
            onClick: () => console.log("Undo"),
          },
          duration: 5000 // Ensure it doesn't stick forever
        });
      }

      return uploadFile({
        file,
        ownerId,
        accountId,
        path,
        metadata: cleanMetadata,
      }).then((uploadedFile) => {
        if (uploadedFile) {
          setFiles((prev) => prev.filter((f) => f.name !== file.name));
        }
      });
    });

    await Promise.all(uploadPromises);

    // ✅ All done — now reset
    toast.success("Files uploaded successfully!", { duration: 3000 });
    form.reset();
    setShowMetadata(false);
  },
  [ownerId, accountId, path, form]
);



      const {getRootProps, getInputProps} = useDropzone({onDrop})

      const handleRemoveFile = (e:React.MouseEvent<HTMLImageElement, MouseEvent>, fileName:string)=>{
        e.stopPropagation();
        setFiles((prevFiles)=>prevFiles.filter((file)=>file.name !==fileName))
      };
      return (
        <div className="space-y-6">
  {/* Dropzone Area */}
  <div {...getRootProps()} className="cursor-pointer w-fit">
    <input {...getInputProps()} />
    <Button type="button" className={cn('uploader-button', className)}>
      <Image src="/assets/icons/upload.svg" alt='upload' width={24} height={24} />
      <p>Upload</p>
    </Button>
  </div>

  {/* Preview List */}
  {files.length > 0 && (
    <ul className='uploader-preview-list'>
      <h4 className='h4 text-light-100'>Uploading</h4>
      {files.map((file, index) => {
        const { type, extension } = getFileType(file.name);

        return (
          <li key={`${file.name}-${index}`} className='uploader-preview-item'>
            <div className='flex items-center gap-3'>
              <Thumbnail type={type} extension={extension} url={convertFileToUrl(file)} />
              <div className='preview-item-name'>
                {file.name}
                <Image src="/assets/icons/file-loader.gif" width={80} height={26} alt="Loader" />
              </div>
            </div>
            <Image
              src="/assets/icons/remove.svg"
              width={24}
              height={24}
              alt='Remove'
              onClick={(e) => handleRemoveFile(e, file.name)}
            />
          </li>
        );
      })}
    </ul>
  )}

  {/* Metadata Form Section */}
  <div>
    <Button type="button" variant="outline" onClick={() => setShowMetadata((prev) => !prev)}>
      {showMetadata ? "Hide Metadata" : "Add Metadata"}
    </Button>

    {showMetadata && (
      <FormProvider {...form}>
        <form className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Trial />
          <CompanyAndAddressMetadataCombobox
            companyName={form.watch("companyName")}
            companyAddress={form.watch("companyAddress")}
            onCompanyChange={(name, id) => {
              form.setValue("companyName", name)
              // Optionally store companyId if needed
            }}
            onAddressChange={(address, meta) => {
              form.setValue("companyAddress", address)
              form.setValue("state", meta.state)
              form.setValue("latitude", meta.latitude)
              form.setValue("longitude", meta.longitude)
              form.setValue("companyEmail", meta.email)
              form.setValue("phoneNo", meta.phone)
            }}
          />

          {renderField("companyEmail", "Company Email", "@.com")}
          {renderField("phoneNo", "Phone Number", "Phone No.")}
          {renderField("latitude", "Latitude", "e.g. 34.0522")}
          {renderField("longitude", "Longitude", "e.g. -118.2437")}
          {renderField("inspectionType", "Inspection Type", "e.g. Safety Check")}
          {renderField("state", "State", "state")}
          {renderField("inspectedProductLine", "Inspected ProductLine", "Name of Product Line")}
          {renderField("gmpStatus", "GMP Status", "Level of Risk")}
          {renderField("inspectors", "Inspectors", "Lead Inspector")}
        </form>
      </FormProvider>
    )}
  </div>
</div>

      )
    }

export default FileUploader
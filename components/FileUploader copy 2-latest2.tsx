"use client"

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from './ui/button'
import Image from 'next/image'
import { cn, convertFileToUrl, getFileType } from '@/lib/utils'
import Thumbnail from './Thumbnail'
import { MAX_FILE_SIZE } from '@/constants'
import { toast } from "sonner"
import { usePathname } from 'next/navigation'
import { uploadFile } from '@/lib/actions/file.actions'

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { metadataSchema } from '@/app/schemas/metadataSchemas'
import { z } from "zod";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { Input } from './ui/input'
import { CompanyAndAddressMetadataCombobox } from './CompanyAndAddressMetadataCombobox'
import Trial from './Trial'
import MetadataTableSelector from './MetadataTableSelector'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from './ui/dialog'


const FileUploader = ({ ownerId, accountId, className }) => {
  const path = usePathname();
  const [files, setFiles] = useState([]);
  const [showMetadata, setShowMetadata] = useState(false);
  const [selectedMetadataId, setSelectedMetadataId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState([]);

  const form = useForm({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      companyName: "",
      companyAddress: "",
      companyEmail: "",
      phoneNo: "",
      state: "",
      latitude: 0,
      longitude: 0,
      inspectionType: "",
      inspectedProductLine: "",
      gmpStatus: "",
      inspectors: "",
    },
  });

  const renderField = (name, label, placeholder) => (
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

  const processUpload = async (incomingFiles) => {
    let cleanMetadata = null;

    if (showMetadata) {
      const isValid = await form.trigger();
      if (!isValid) {
        toast("Please fill in all metadata fields.", {
          description: "Metadata is required when enabled.",
          duration: 3000,
        });
        return;
      }
      const metadata = form.getValues();
      cleanMetadata = {
        ...metadata,
        latitude: parseFloat(metadata.latitude),
        longitude: parseFloat(metadata.longitude),
      };
    }

    const uploadPromises = incomingFiles.map(async (file) => {
      if (file.size > MAX_FILE_SIZE) {
        setFiles((prev) => prev.filter((f) => f.name !== file.name));
        return toast("File Size Issues", {
          description: (
            <p className="bg-red p-4 rounded-2xl">
              <span className="font-semibold">{file.name}</span> is too large. Max file size is 50MB
            </p>
          ),
          duration: 5000,
        });
      }

      return uploadFile({
        file,
        ownerId,
        accountId,
        path,
        metadata: cleanMetadata ?? undefined,
        linkedMetadataId: selectedMetadataId && selectedMetadataId !== "selecting" ? selectedMetadataId : undefined,
      }).then((uploadedFile) => {
        if (uploadedFile) {
          setFiles((prev) => prev.filter((f) => f.name !== file.name));
        }
      });
    });

    await Promise.all(uploadPromises);
    toast.success("Files uploaded successfully!", { duration: 3000 });
    if (showMetadata) form.reset();
    setShowMetadata(false);
    setSelectedMetadataId(null);
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (selectedMetadataId && selectedMetadataId !== "selecting") {
      setFilesToUpload(acceptedFiles);
      setShowConfirmModal(true);
    } else {
      processUpload(acceptedFiles);
    }
  }, [selectedMetadataId, showMetadata]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleRemoveFile = (e, fileName) => {
    e.stopPropagation();
    setFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
  };

  return (
    <div className="space-y-6">
      <div {...getRootProps()} className="cursor-pointer w-fit">
        <input {...getInputProps()} />
        <Button type="button" className={cn('uploader-button', className)}>
          <Image src="/assets/icons/upload.svg" alt='upload' width={24} height={24} />
          <p>Upload</p>
        </Button>
      </div>

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

      <div className="flex gap-2">
        <Button onClick={() => { setShowMetadata(true); setSelectedMetadataId(null); }}>Add New Metadata</Button>
        <Button onClick={async () => {
          const isValid = await form.trigger();
          if (!isValid) {
            return toast("Please fill in all required metadata fields.", { duration: 3000 });
          }

          const metadata = form.getValues();
          const cleanMetadata = {
            ...metadata,
            latitude: parseFloat(metadata.latitude),
            longitude: parseFloat(metadata.longitude),
          };

          const response = await uploadFile({
            ownerId,
            accountId,
            path,
            metadata: cleanMetadata,
          });

          if (response?.InspectedProductLine === metadata.inspectedProductLine) {
            toast.success("Metadata saved successfully!", { duration: 3000 });
            form.reset();
            setShowMetadata(false);
          } else {
            toast.error("Failed to save metadata.", { duration: 3000 });
          }
        }}>Upload Without Metadata</Button>
        <Button onClick={() => {
          setShowMetadata(false);
          selectedMetadataId === null ? setSelectedMetadataId("selecting") : setSelectedMetadataId(null);
        }}>Link to Existing Metadata</Button>
      </div>

      {(selectedMetadataId === "selecting" || selectedMetadataId != null) && (
        <MetadataTableSelector onSelect={(id) => setSelectedMetadataId(id)} />
      )}

      {showMetadata && (
        <FormProvider {...form}>
          <form className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Trial />
            <CompanyAndAddressMetadataCombobox
              companyName={form.watch("companyName")}
              companyAddress={form.watch("companyAddress")}
              onCompanyChange={(name, id) => form.setValue("companyName", name)}
              onAddressChange={(address, meta) => {
                form.setValue("companyAddress", address);
                form.setValue("state", meta.state);
                form.setValue("latitude", meta.latitude);
                form.setValue("longitude", meta.longitude);
                form.setValue("companyEmail", meta.email);
                form.setValue("phoneNo", meta.phone);
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

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Metadata Link</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to link uploaded files to the selected metadata?</p>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
            <Button onClick={() => {
              processUpload(filesToUpload);
              setShowConfirmModal(false);
              setFilesToUpload([]);
            }}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileUploader;

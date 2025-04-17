"use client";

import React, { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { usePathname } from "next/navigation";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import OTPModal from "./OTPModal";
import { useFileTickContext } from "./context";

import { updateExistingFileMetadata, upsertCompanyAndFileMetadata } from "@/lib/actions/file.actions";

type FormType = "metadata-in" | "metadata-out";

const getSchema = () =>
  z.object({
    companyName: z.string().min(2).max(50),
    companyAddress: z.string(),
    state: z.string(),
    companyEmail: z.string().email(),
    phoneNo: z.string().max(11),
    latitude: z
      .string()
      .transform((val) => parseFloat(val))
      .refine((val) => !isNaN(val) && val >= -90 && val <= 90, {
        message: "Latitude must be between -90 and 90",
      }),
    longitude: z
      .string()
      .transform((val) => parseFloat(val))
      .refine((val) => !isNaN(val) && val >= -180 && val <= 180, {
        message: "Longitude must be between -180 and 180",
      }),
    inspectionType: z.string(),
    inspectedProductLine: z.string(),
    gmpStatus: z.string(),
    inspectors: z.string(),
  });

const MetadataUpdateForm = ({
  type,
  fileId,
  setInputMetadata,
  inputMetadata,
  file,
  closeAllModals,
}: {
  type: FormType;
  fileId: string;
  setInputMetadata: (val: boolean) => void;
  inputMetadata: boolean;
  file: any;
  closeAllModals: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [fileUpdate, setFileUpdate] = useState(file);

  const { setMetaDataTick } = useFileTickContext();
  const path = usePathname();
  const metadataType = "metadata-in";

  const schema = getSchema();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: fileUpdate?.name || "",
      companyAddress: fileUpdate?.CompanyAddress?.[0] || "",
      companyEmail: fileUpdate?.CompanyEmail || "",
      phoneNo: "",
      state: "",
      latitude: z
        .string()
        .transform((val) => parseFloat(val))
        .refine((val) => !isNaN(val) && val >= -90 && val <= 90, {
          message: "Latitude must be between -90 and 90",
        }),
      longitude: z
      .string()
      .transform((val) => parseFloat(val))
      .refine((val) => !isNaN(val) && val >= -180 && val <= 180, {
        message: "Longitude must be between -180 and 180",
      }),
      inspectionType: "",
      inspectedProductLine: "",
      gmpStatus: "",
      inspectors: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const fileDocument =
        metadataType === "metadata-in" &&
        (await updateExistingFileMetadata({
          fileId,
          ...values,
          path,
        }));

      if (fileDocument?.CompanyAddress?.includes(values.companyAddress)) {
        setMetaDataTick(true);
      }

      closeAllModals();
    } catch (err) {
      setErrorMessage("Failed to create metadata. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    setInputMetadata(false);
    closeAllModals();
  };

  const renderField = (
    name: keyof z.infer<typeof schema>,
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
              {type === metadataType ? (
                <Input
                  className="shad-input"
                  placeholder={placeholder}
                  {...field}
                  value={field.value || ""}
                />
              ) : (
                <p>{defaultValue || "—"}</p>
              )}
            </FormControl>
          </div>
          <FormMessage className="shad-form-message" />
        </FormItem>
      )}
    />
  );

  return (
    <>
      {metadataType === "metadata-in" && (
        <Form {...form}>
          <div className="max-h-96 overflow-y-auto border-none p-4">
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="metadata-form"
            >
              <h1 className="metadata-form-title">
                {inputMetadata ? "Update Metadata" : "Input Metadata"}
                <br />
                <span className="text-brand text-sm font-semibold">
                  ({inputMetadata ? "Update" : "Submit"} metadata)
                </span>
              </h1>

              {renderField("companyName", "Company Name", "Enter company name")}
              {renderField(
                "companyAddress",
                "Company Address",
                "Enter address"
              )}
              {renderField("companyEmail", "Company Email", "Enter email")}
              {renderField("phoneNo", "Phone Number", "Enter phone number")}
              {renderField("state", "State", "Enter state")}
              {renderField("latitude", "Latitude", "Enter latitude")}
              {renderField("longitude", "Longitude", "Enter longitude")}
              {renderField(
                "inspectionType",
                "Inspection Type",
                "Enter type"
              )}
              {renderField(
                "inspectedProductLine",
                "Product Line",
                "Enter product line"
              )}
              {renderField("gmpStatus", "GMP Status", "Enter status")}
              {renderField("inspectors", "Inspectors", "Enter inspectors")}

              <div className="flex gap-2 mt-4">
                <Button type="submit" className="form-submit-button" disabled={isLoading}>
                  {inputMetadata ? "Update" : "Submit"}
                  {isLoading && (
                    <Image
                      src="/assets/icons/loader.svg"
                      alt="loader"
                      width={24}
                      height={24}
                      className="ml-2 animate-spin"
                    />
                  )}
                </Button>
                {inputMetadata && (
                  <Button
                    type="button"
                    className="form-submit-button"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    Cancel
                    {isLoading && (
                      <Image
                        src="/assets/icons/loader.svg"
                        alt="loader"
                        width={24}
                        height={24}
                        className="ml-2 animate-spin"
                      />
                    )}
                  </Button>
                )}
              </div>

              {errorMessage && (
                <p className="error-message">* {errorMessage}</p>
              )}
            </form>
          </div>
        </Form>
      )}
      {accountId && (
        <OTPModal
          email={form.getValues("companyEmail")}
          accountId={accountId}
        />
      )}
    </>
  );
};

export default MetadataUpdateForm;

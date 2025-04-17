// schemas/metadataSchema.ts
import { z } from "zod";

export const metadataSchema = z.object({
  companyName: z.string().min(1),
  companyAddress: z.string().min(1),
  companyEmail:z.string().min(1),
  phoneNo:z.string().max(11),
  state:z.string().min(1),
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
  inspectedProductLine:z.string().min(1),
  gmpStatus:z.string().min(1),
  inspectors:z.string().min(1),
  inspectionType: z.string().min(1),
});

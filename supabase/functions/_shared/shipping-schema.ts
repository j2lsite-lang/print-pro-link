import { z } from "https://esm.sh/zod@3.23.8";
export const ShippingAddressSchema = z.object({
  country: z.string().regex(/^[A-Z]{2}$/),
  postalCode: z.string().trim().max(20).optional(),
  city: z.string().trim().max(120).optional(),
  street: z.string().trim().max(300).optional(),
  houseNumber: z.string().trim().max(30).optional(),
});
export const ShippingLineSchema = z.object({
  sku: z.string().regex(/^[a-z0-9._-]{1,120}$/i),
  quantity: z.number().int().min(1).max(100),
  copies: z.number().int().min(1).max(10_000_000),
  configuration: z.record(z.union([z.string().max(300), z.number().finite()])),
}).refine(i => Number(i.configuration.copies) === i.copies, "Quantité incohérente");
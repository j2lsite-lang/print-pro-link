// submit-quote – server-side validation and recording of quote requests.
// Every line is re-priced from live Print.com data: client prices are ignored.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";
import { supplierQuantities, supplierSelection } from "../_shared/supplier-quantities.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Must match src/lib/pricing.ts
const MARGIN_COEFFICIENT = 1.8;
const DESIGN_FEE_BASE = 65;
const FLAT_SHIPPING_HT = 11.9;
const roundUp10 = (v: number) => Math.ceil(v * 10 - 1e-9) / 10;

function supplierPrice(r: any): number {
  if (!r) return 0;
  if (r.price?.totalPrice != null) return Number(r.price.totalPrice) || 0;
  if (r.totalPrice != null) return Number(r.totalPrice) || 0;
  if (r.prices?.salesPrice != null) return Number(r.prices.salesPrice) || 0;
  if (r.prices?.productPrice != null) return Number(r.prices.productPrice) || 0;
  if (r.prices?.normalPrice != null) return Number(r.prices.normalPrice) || 0;
  return 0;
}

const s = (max: number) => z.string().trim().max(max);
const Item = z.object({
  productName: s(300),
  sku: z.string().regex(/^[a-z0-9._-]{1,120}$/i),
  quantity: z.number().int().min(1).max(100),
  copies: z.number().int().min(1).max(10_000_000),
  configuration: z.record(z.union([z.string(), z.number()])),
  options: z.record(z.any()).optional(),
  includeDesignFee: z.boolean().optional(),
  fileUrl: s(500).nullable().optional(),
  fileName: s(300).nullable().optional(),
});
const Body = z.object({
  reference: z.string().regex(/^DEVIS-[A-F0-9]{8}$/),
  name: s(200).min(1),
  company: s(200).nullable().optional(),
  email: z.string().trim().email().max(255),
  phone: s(50).nullable().optional(),
  address: s(300).nullable().optional(),
  postal_code: s(20).nullable().optional(),
  city: s(120).nullable().optional(),
  message: s(5000).nullable().optional(),
  items: z.array(Item).min(1).max(50),
});

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function printcom(method: string, path: string, body?: unknown) {
  const res = await fetch(`https://api.print.com${path}`, {
    method,
    headers: {
      Authorization: `PrintApiKey ${Deno.env.get("PRINTCOM_API_KEY")}`,
      "Accept-Language": "fr-FR",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { /* non-JSON */ }
  return { ok: res.ok, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  let parsed;
  try { parsed = Body.safeParse(await req.json()); } catch { return json({ error: "Requête invalide" }, 400); }
  if (!parsed.success) return json({ error: "Données invalides", details: parsed.error.flatten().fieldErrors }, 400);
  const body = parsed.data;

  const validated = [];
  for (const item of body.items) {
    const product = await printcom("GET", `/products/${item.sku}?view=reseller`);
    if (!product.ok || !product.data) return json({ error: `Produit indisponible : « ${item.productName} ».` }, 422);
    const props = product.data.properties || product.data.configurableProperties || [];
    const { copies: _c, ...config } = item.configuration;
    const allowed = supplierQuantities(props.find((p: any) => p.slug === "copies"),
      supplierSelection(product.data, config), product.data.excludes);
    if (!allowed.includes(item.copies)) return json({ error: `Quantité indisponible pour « ${item.productName} ».` }, 422);

    const { urgency, ...options } = config as Record<string, unknown>;
    const price = await printcom("POST", `/products/${item.sku}/price`, {
      sku: item.sku,
      options: { ...options, copies: item.copies },
      deliveryPromise: urgency === "express" ? 1 : 0,
    });
    const supplier = supplierPrice(price.data);
    if (!price.ok || !Number.isFinite(supplier) || supplier <= 0) {
      return json({ error: `Configuration indisponible chez le fournisseur pour « ${item.productName} ».` }, 422);
    }
    const unit = roundUp10(supplier * MARGIN_COEFFICIENT) + (item.includeDesignFee ? DESIGN_FEE_BASE : 0);
    validated.push({
      product_name: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      copies: item.copies,
      options: item.options ?? null,
      configuration: { ...config, copies: item.copies },
      supplier_price_ht: supplier,
      include_design_fee: !!item.includeDesignFee,
      unit_price: unit,
      line_total: Math.round(unit * item.quantity * 100) / 100,
      currency: "EUR",
      file_url: item.fileUrl ?? null,
      file_name: item.fileName ?? null,
    });
  }

  const productsTotal = Math.round(validated.reduce((t, i) => t + i.line_total, 0) * 100) / 100;
  const total = Math.round((productsTotal + FLAT_SHIPPING_HT) * 100) / 100;
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await admin.from("quote_requests").insert({
    reference: body.reference,
    name: body.name,
    company: body.company ?? null,
    email: body.email,
    phone: body.phone ?? null,
    address: body.address ?? null,
    postal_code: body.postal_code ?? null,
    city: body.city ?? null,
    message: body.message ?? null,
    items: validated,
    products_total_ht: productsTotal,
    shipping_amount_ht: FLAT_SHIPPING_HT,
    shipping_cost: FLAT_SHIPPING_HT,
    estimated_total_ht: total,
    estimated_total: total,
    currency: "EUR",
  });
  if (error) {
    console.error("[submit-quote] insert failed", error.message);
    return json({ error: "Enregistrement du devis impossible." }, 500);
  }
  return json({ reference: body.reference, items: validated, productsTotalHt: productsTotal, shippingHt: FLAT_SHIPPING_HT, estimatedTotalHt: total });
});

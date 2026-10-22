import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "https://esm.sh/zod@3.23.8";
import { calculateShipping } from "../_shared/shipping.ts";
import { ShippingAddressSchema, ShippingLineSchema } from "../_shared/shipping-schema.ts";
import { supplierQuantities, supplierSelection } from "../_shared/supplier-quantities.ts";
const Body = z.object({ items: z.array(ShippingLineSchema).min(1).max(50), address: ShippingAddressSchema, method: z.string().max(100).optional() });
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
async function supplier(method: string, path: string, body?: unknown) {
  const response = await fetch(`https://api.print.com${path}`, { method, headers: {
    Authorization: `PrintApiKey ${Deno.env.get("PRINTCOM_API_KEY")}`, "Content-Type": "application/json", "Accept-Language": "fr-FR",
  }, body: body ? JSON.stringify(body) : undefined });
  return { ok: response.ok, data: await response.json() };
}
// Public read-only quote calculation: no customer records or credentials returned.
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Configuration de livraison invalide" }, 400);
    for (const line of parsed.data.items) {
      const p = await supplier("GET", `/products/${line.sku}?view=reseller`);
      if (!p.ok) return json({ status: "on_quote", shippingHt: null, choices: [], selectedMethod: null });
      const props = p.data.properties || p.data.configurableProperties || [];
      const allowed = supplierQuantities(props.find((v: any) => v.slug === "copies"), supplierSelection(p.data, line.configuration), p.data.excludes);
      if (!allowed.includes(line.copies)) return json({ error: "Quantité indisponible" }, 422);
      const { urgency, ...options } = line.configuration;
      const price = await supplier("POST", `/products/${line.sku}/price`, { sku: line.sku, options: { ...options, copies: line.copies }, deliveryPromise: urgency === "express" ? 1 : 0 });
      const amount = price.data?.prices?.salesPrice ?? price.data?.price?.totalPrice ?? price.data?.totalPrice;
      if (!price.ok || typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || price.data?.error || price.data?.errorMessage) return json({ status: "on_quote", shippingHt: null, choices: [], selectedMethod: null });
    }
    return json(await calculateShipping(parsed.data.items, parsed.data.address, supplier, parsed.data.method));
  } catch { return json({ status: "on_quote", shippingHt: null, choices: [], selectedMethod: null }); }
});
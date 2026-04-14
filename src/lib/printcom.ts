const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const FUNCTION_NAME = "printcom-proxy";

async function callProxy(
  action: string,
  params: Record<string, string> = {},
  body?: unknown,
) {
  const searchParams = new URLSearchParams({ action, ...params });
  const url = `${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}?${searchParams.toString()}`;

  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Print.com API error [${res.status}]: ${errBody}`);
  }

  return res.json();
}

// ── Products ──
export const listProducts = (lang = "fr-FR") =>
  callProxy("list-products", { lang });

export const getProduct = (sku: string, lang = "fr-FR") =>
  callProxy("get-product", { sku, view: "reseller", lang });

export const getPrice = (sku: string, body: unknown, lang = "fr-FR") =>
  callProxy("get-price", { sku, lang }, body);

export const getAccessories = (sku: string, lang = "fr-FR") =>
  callProxy("get-accessories", { sku, lang });

export const batchSpecs = (body: unknown, lang = "fr-FR") =>
  callProxy("batch-specs", { lang }, body);

// ── Shipping ──
export const getShippableCountries = (lang = "fr-FR") =>
  callProxy("shippable-countries", { lang });

export const getShippingPossibilities = (body: unknown, lang = "fr-FR") =>
  callProxy("shipping-possibilities", { lang }, body);

export const getCombinedShipment = (body: unknown, lang = "fr-FR") =>
  callProxy("combined-shipment", { lang }, body);

// ── Orders ──
export const createOrder = (body: unknown, lang = "fr-FR") =>
  callProxy("create-order", { lang }, body);

export const listOrders = (lang = "fr-FR") =>
  callProxy("list-orders", { lang });

export const getOrder = (orderNumber: string, lang = "fr-FR") =>
  callProxy("get-order", { orderNumber, lang });

export const updateOrder = (orderNumber: string, body: unknown, lang = "fr-FR") =>
  callProxy("update-order", { orderNumber, lang }, body);

// ── PDF ──
export const pdfPreflight = (body: unknown, lang = "fr-FR") =>
  callProxy("pdf-preflight", { lang }, body);

export const pdfPreview = (file: string, lang = "fr-FR") =>
  callProxy("pdf-preview", { file, lang });

export const pdfLinks = (platformUrl: string, lang = "fr-FR") =>
  callProxy("pdf-links", { platformUrl, lang });

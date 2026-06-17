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
    throw new Error(`Erreur catalogue [${res.status}]: ${errBody}`);
  }

  return res.json();
}

export interface CatalogProduct {
  sku: string;
  name: string;
  thumbnailUrl?: string | null;
  active?: boolean;
}

function getCmsAssetUrl(assetId: string | undefined, assets: Record<string, any> | undefined) {
  if (!assetId || !assets?.[assetId]?.file) return null;
  return `https:${assets[assetId].file}`;
}

// ── Products ──
export const listProducts = (lang = "fr-FR") =>
  callProxy("list-products", { lang });

export const getCmsCatalog = () =>
  callProxy("get-cms");

export async function getCatalogProducts(lang = "fr-FR"): Promise<CatalogProduct[]> {
  const [apiProducts, cms] = await Promise.all([
    listProducts(lang).catch(() => []),
    getCmsCatalog().catch(() => null),
  ]);

  const assets = cms?.asset as Record<string, any> | undefined;
  const cmsProducts = cms?.product as Record<string, any> | undefined;
  const merged = new Map<string, CatalogProduct>();

  for (const product of Array.isArray(apiProducts) ? apiProducts : []) {
    const sku = product?.sku;
    if (!sku) continue;

    const cmsProduct = cmsProducts ? Object.values(cmsProducts).find((item: any) => item?.sku === sku) as any : null;
    const thumbnailUrl =
      product?.thumbnailUrl ||
      product?.thumbnail_url ||
      getCmsAssetUrl(cmsProduct?.image?.id || cmsProduct?.icon?.id, assets);

    merged.set(sku, {
      sku,
      name: product?.titleSingle || product?.name || sku,
      thumbnailUrl,
      active: product?.active !== false,
    });
  }

  for (const cmsProduct of Object.values(cmsProducts || {})) {
    const sku = (cmsProduct as any)?.sku;
    if (!sku) continue;

    const thumbnailUrl = getCmsAssetUrl(
      (cmsProduct as any)?.image?.id || (cmsProduct as any)?.icon?.id,
      assets,
    );

    if (merged.has(sku)) {
      const existing = merged.get(sku)!;
      if (!existing.thumbnailUrl && thumbnailUrl) {
        existing.thumbnailUrl = thumbnailUrl;
      }
      continue;
    }

    merged.set(sku, {
      sku,
      name: (cmsProduct as any)?.productName || sku,
      thumbnailUrl,
      active: true,
    });
  }

  return Array.from(merged.values())
    .filter((product) => product.active !== false)
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

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

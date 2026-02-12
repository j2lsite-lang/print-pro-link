const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const FUNCTION_NAME = "printcom-proxy";

async function callProxy(action: string, params: Record<string, string> = {}, body?: unknown) {
  const searchParams = new URLSearchParams({ action, ...params });
  const url = `${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}?${searchParams.toString()}`;

  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`PrintCom API error [${res.status}]: ${errBody}`);
  }

  return res.json();
}

// Products
export const listProducts = () => callProxy("list-products");
export const getProduct = (sku: string) => callProxy("get-product", { sku });
export const getPrice = (sku: string, options: Record<string, unknown>) => callProxy("get-price", { sku }, options);
export const getAccessories = (sku: string) => callProxy("get-accessories", { sku });

// Shipping
export const getShippableCountries = () => callProxy("shippable-countries");
export const getShippingPossibilities = (payload: unknown) => callProxy("shipping-possibilities", {}, payload);
export const getCombinedShipment = (payload: unknown) => callProxy("combined-shipment", {}, payload);

// Orders
export const createOrder = (payload: unknown) => callProxy("create-order", {}, payload);
export const listOrders = () => callProxy("list-orders");
export const getOrder = (orderNumber: string) => callProxy("get-order", { orderNumber });
export const updateOrder = (orderNumber: string, payload: unknown) => callProxy("update-order", { orderNumber }, payload);

// PDF
export const pdfPreflight = (payload: unknown) => callProxy("pdf-preflight", {}, payload);
export const pdfPreview = (file: string) => callProxy("pdf-preview", { file });
export const pdfLinks = (platformUrl: string) => callProxy("pdf-links", { platformUrl });

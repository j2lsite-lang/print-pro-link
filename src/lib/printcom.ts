import { supabase } from "@/integrations/supabase/client";

const FUNCTION_NAME = "printcom-proxy";

async function callProxy(action: string, params: Record<string, string> = {}, body?: unknown) {
  const searchParams = new URLSearchParams({ action, ...params });
  
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json" } : undefined,
  });

  // supabase.functions.invoke doesn't support query params directly, so we use fetch
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${FUNCTION_NAME}?${searchParams.toString()}`;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      "apikey": anonKey,
      "Authorization": `Bearer ${anonKey}`,
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

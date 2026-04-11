const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const FUNCTION_NAME = "realisaprint-proxy";

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
    throw new Error(`Realisaprint API error [${res.status}]: ${errBody}`);
  }

  return res.json();
}

// ── Products ──
export const listProducts = () => callProxy("products");

export const getConfigurations = (productId: string) =>
  callProxy("configurations", { product: productId });

export const showVariables = (
  productId: string,
  stockId: string,
  variables: Record<string, string>,
  retry = true,
) =>
  callProxy("show_variables", { product: productId, stock: stockId }, { variables, retry });

export const saveConfiguration = (
  productId: string,
  stockId: string,
  variables: Record<string, string>,
) =>
  callProxy("save_configuration", { product: productId, stock: stockId }, { variables });

export const getPrice = (code: string, quantity: string, country = "FR") =>
  callProxy("get_price", { code, quantity, country });

export const getConfigDetails = (code: string) =>
  callProxy("config_details", { code });

// ── Orders ──
export interface CreateOrderParams {
  code: string;
  quantity: string;
  reference: string;
  company?: string;
  name: string;
  surname: string;
  phone: string;
  email: string;
  address: string;
  zip: string;
  city: string;
  country: string;
  control_file?: boolean;
}

export const createOrder = (params: CreateOrderParams) =>
  callProxy("create_order", {}, params);

export const getOrder = (reference: string) =>
  callProxy("get_order", { reference });

export const getIsoCountries = () => callProxy("get_iso_countries");

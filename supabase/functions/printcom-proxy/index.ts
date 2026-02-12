import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAuthToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.token;
  }

  const apiBase = Deno.env.get("PRINTCOM_API_BASE") || "https://api.print.com";
  const username = Deno.env.get("PRINTCOM_USERNAME");
  const password = Deno.env.get("PRINTCOM_PASSWORD");

  if (!username || !password) {
    throw new Error("PRINTCOM_USERNAME or PRINTCOM_PASSWORD not configured");
  }

  const res = await fetch(`${apiBase}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Print.com login failed [${res.status}]: ${body}`);
  }

  const data = await res.json();
  const token = data.token || data.access_token || data.jwt;
  if (!token) throw new Error("No token in login response");

  // Cache for 55 minutes (assuming 1h expiry)
  cachedToken = { token, expiresAt: now + 55 * 60 * 1000 };
  return token;
}

async function proxyRequest(
  method: string,
  path: string,
  body: unknown | null,
  lang: string
): Promise<Response> {
  const token = await getAuthToken();
  
  // Determine base URL
  const apiBase = Deno.env.get("PRINTCOM_API_BASE") || "https://api.print.com";
  const platformBase = Deno.env.get("PRINTCOM_PLATFORM_BASE") || "https://platform.print.com";
  
  const isPlatform = path.startsWith("/pdf/") || path.startsWith("/products/batch/");
  const baseUrl = isPlatform ? platformBase : apiBase;
  const url = `${baseUrl}${path}`;

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${token}`,
    "Accept-Language": lang,
    "Content-Type": "application/json",
  };

  const fetchOptions: RequestInit = { method, headers };
  if (body && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  console.log(`[PrintCom Proxy] ${method} ${url}`);
  const res = await fetch(url, fetchOptions);
  const responseBody = await res.text();

  return new Response(responseBody, {
    status: res.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const lang = url.searchParams.get("lang") || "fr-FR";
    
    let body = null;
    if (req.method === "POST" || req.method === "PUT") {
      try { body = await req.json(); } catch { body = null; }
    }

    // Route based on action parameter
    switch (action) {
      // Products
      case "list-products":
        return proxyRequest("GET", "/products", null, lang);
      
      case "get-product": {
        const sku = url.searchParams.get("sku");
        if (!sku) return new Response(JSON.stringify({ error: "sku required" }), { status: 400, headers: corsHeaders });
        return proxyRequest("GET", `/products/${sku}`, null, lang);
      }
      
      case "get-price": {
        const sku = url.searchParams.get("sku");
        if (!sku) return new Response(JSON.stringify({ error: "sku required" }), { status: 400, headers: corsHeaders });
        return proxyRequest("POST", `/products/${sku}/price`, body, lang);
      }
      
      case "get-accessories": {
        const sku = url.searchParams.get("sku");
        if (!sku) return new Response(JSON.stringify({ error: "sku required" }), { status: 400, headers: corsHeaders });
        return proxyRequest("GET", `/accessories/${sku}`, null, lang);
      }

      case "batch-specs":
        return proxyRequest("POST", "/products/batch/specs", body, lang);

      // Shipping
      case "shippable-countries":
        return proxyRequest("GET", "/shipping/shippable-countries", null, lang);
      
      case "shipping-possibilities":
        return proxyRequest("POST", "/shipping/shipping-possibilities", body, lang);
      
      case "combined-shipment":
        return proxyRequest("POST", "/shipping/combined-shipment", body, lang);

      // Orders
      case "create-order":
        return proxyRequest("POST", "/orders", body, lang);
      
      case "list-orders":
        return proxyRequest("GET", "/orders", null, lang);
      
      case "get-order": {
        const orderNumber = url.searchParams.get("orderNumber");
        if (!orderNumber) return new Response(JSON.stringify({ error: "orderNumber required" }), { status: 400, headers: corsHeaders });
        return proxyRequest("GET", `/orders/${orderNumber}`, null, lang);
      }
      
      case "update-order": {
        const orderNumber = url.searchParams.get("orderNumber");
        if (!orderNumber) return new Response(JSON.stringify({ error: "orderNumber required" }), { status: 400, headers: corsHeaders });
        return proxyRequest("PUT", `/orders/${orderNumber}`, body, lang);
      }

      // PDF Preflight
      case "pdf-preflight":
        return proxyRequest("POST", "/pdf/preflight", body, lang);
      
      case "pdf-preview": {
        const file = url.searchParams.get("file");
        if (!file) return new Response(JSON.stringify({ error: "file required" }), { status: 400, headers: corsHeaders });
        return proxyRequest("GET", `/pdf/preview/${file}`, null, lang);
      }
      
      case "pdf-links": {
        const platformUrl = url.searchParams.get("platformUrl");
        if (!platformUrl) return new Response(JSON.stringify({ error: "platformUrl required" }), { status: 400, headers: corsHeaders });
        return proxyRequest("GET", `/pdf/links/${encodeURIComponent(platformUrl)}`, null, lang);
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action", availableActions: [
            "list-products", "get-product", "get-price", "get-accessories", "batch-specs",
            "shippable-countries", "shipping-possibilities", "combined-shipment",
            "create-order", "list-orders", "get-order", "update-order",
            "pdf-preflight", "pdf-preview", "pdf-links"
          ]}),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("[PrintCom Proxy] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

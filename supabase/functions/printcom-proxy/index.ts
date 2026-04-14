// printcom-proxy – Proxy for Print.com API
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getApiKey(): string {
  const apiKey = Deno.env.get("PRINTCOM_API_KEY");
  if (!apiKey) throw new Error("PRINTCOM_API_KEY not configured");
  return apiKey;
}

async function proxyRequest(
  method: string,
  path: string,
  body: unknown | null,
  lang: string,
): Promise<Response> {
  const apiKey = getApiKey();
  const apiBase = Deno.env.get("PRINTCOM_API_BASE") || "https://api.print.com";
  const platformBase = Deno.env.get("PRINTCOM_PLATFORM_BASE") || "https://platform.print.com";

  const isPlatform = path.startsWith("/pdf/") || path.startsWith("/products/batch/");
  const baseUrl = isPlatform ? platformBase : apiBase;
  const url = `${baseUrl}${path}`;

  const headers: Record<string, string> = {
    Authorization: `PrintApiKey ${apiKey}`,
    "Accept-Language": lang,
    "Content-Type": "application/json",
  };

  const fetchOptions: RequestInit = { method, headers };
  if (body && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  console.log(`[PrintCom] ${method} ${url}`);
  const res = await fetch(url, fetchOptions);
  const responseBody = await res.text();
  console.log(`[PrintCom] ${res.status} (${responseBody.length} bytes)`);

  return new Response(responseBody, {
    status: res.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonError(msg: string, status = 400): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const lang = url.searchParams.get("lang") || "fr-FR";

    let body: unknown = null;
    if (req.method === "POST" || req.method === "PUT") {
      try { body = await req.json(); } catch { body = null; }
    }

    switch (action) {
      // ── Products ──
      case "list-products":
        return proxyRequest("GET", "/products", null, lang);

      case "get-product": {
        const sku = url.searchParams.get("sku");
        if (!sku) return jsonError("sku required");
        const view = url.searchParams.get("view") || "reseller";
        return proxyRequest("GET", `/products/${sku}?view=${view}`, null, lang);
      }

      case "get-price": {
        const sku = url.searchParams.get("sku");
        if (!sku) return jsonError("sku required");
        return proxyRequest("POST", `/products/${sku}/price`, body, lang);
      }

      case "get-accessories": {
        const sku = url.searchParams.get("sku");
        if (!sku) return jsonError("sku required");
        return proxyRequest("GET", `/accessories/${sku}`, null, lang);
      }

      case "batch-specs":
        return proxyRequest("POST", "/products/batch/specs", body, lang);

      // ── Shipping ──
      case "shippable-countries":
        return proxyRequest("GET", "/shipping/shippable-countries", null, lang);

      case "shipping-possibilities":
        return proxyRequest("POST", "/shipping/shipping-possibilities", body, lang);

      case "combined-shipment":
        return proxyRequest("POST", "/shipping/combined-shipment", body, lang);

      // ── Orders ──
      case "create-order":
        return proxyRequest("POST", "/orders", body, lang);

      case "list-orders":
        return proxyRequest("GET", "/orders", null, lang);

      case "get-order": {
        const orderNumber = url.searchParams.get("orderNumber");
        if (!orderNumber) return jsonError("orderNumber required");
        return proxyRequest("GET", `/orders/${orderNumber}`, null, lang);
      }

      case "update-order": {
        const orderNumber = url.searchParams.get("orderNumber");
        if (!orderNumber) return jsonError("orderNumber required");
        return proxyRequest("PUT", `/orders/${orderNumber}`, body, lang);
      }

      // ── PDF ──
      case "pdf-preflight":
        return proxyRequest("POST", "/pdf/preflight", body, lang);

      case "pdf-preview": {
        const file = url.searchParams.get("file");
        if (!file) return jsonError("file required");
        return proxyRequest("GET", `/pdf/preview/${file}`, null, lang);
      }

      case "pdf-links": {
        const platformUrl = url.searchParams.get("platformUrl");
        if (!platformUrl) return jsonError("platformUrl required");
        return proxyRequest("GET", `/pdf/links?url=${encodeURIComponent(platformUrl)}`, null, lang);
      }

      default:
        return jsonError(`Unknown action: ${action}. Available: list-products, get-product, get-price, get-accessories, batch-specs, shippable-countries, shipping-possibilities, combined-shipment, create-order, list-orders, get-order, update-order, pdf-preflight, pdf-preview, pdf-links`);
    }
  } catch (error) {
    console.error("[PrintCom] Unhandled error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(message, 500);
  }
});

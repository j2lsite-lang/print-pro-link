// printcom-proxy v9 – API key only (per provider recommendation)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// --- Proxy Request ---
async function proxyRequest(
  method: string,
  path: string,
  body: unknown | null,
  lang: string,
): Promise<Response> {
  const apiBase = Deno.env.get("PRINTCOM_API_BASE") || "https://api.print.com";
  const platformBase = Deno.env.get("PRINTCOM_PLATFORM_BASE") || "https://platform.print.com";

  const apiKey = Deno.env.get("PRINTCOM_API_KEY");
  if (!apiKey) {
    return jsonResponse({ error: "PRINTCOM_API_KEY not configured" }, 500);
  }

  const isPlatform = path.startsWith("/pdf/") || path.startsWith("/products/batch/");
  const baseUrl = isPlatform ? platformBase : apiBase;
  const url = `${baseUrl}${path}`;

  const headers: Record<string, string> = {
    Authorization: `PrintApiKey ${apiKey}`,
    "Accept-Language": lang,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const fetchOptions: RequestInit = { method, headers };
  if (body && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  console.log(`[proxy] ${method} ${url}`);
  if (body && method !== "GET") {
    console.log(`[proxy] body: ${JSON.stringify(body).substring(0, 500)}`);
  }

  const res = await fetch(url, fetchOptions);
  const text = await res.text();
  console.log(`[proxy] response ${res.status} (${text.length} bytes)`);

  if (!res.ok) {
    console.warn(`[proxy] Print.com error ${res.status}: ${text.substring(0, 500)}`);
  }

  return new Response(text, {
    status: res.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// --- Safe Body Parser ---
async function safeParseBody(req: Request): Promise<Record<string, unknown> | null> {
  if (req.method !== "POST" && req.method !== "PUT") return null;
  try {
    const parsed = await req.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

// --- Main Handler ---
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const lang = url.searchParams.get("lang") || "fr-FR";

    console.log(`[proxy] action=${action} method=${req.method}`);

    const body = await safeParseBody(req);

    switch (action) {
      case "list-products":
        return proxyRequest("GET", "/products", null, lang);

      case "get-product": {
        const sku = url.searchParams.get("sku");
        if (!sku) return jsonResponse({ error: "sku required" }, 400);
        return proxyRequest("GET", `/products/${sku}`, null, lang);
      }

      case "get-price": {
        const sku = url.searchParams.get("sku");
        if (!sku) return jsonResponse({ error: "sku required" }, 400);
        if (req.method !== "POST") {
          return jsonResponse({ error: "get-price requires POST method" }, 405);
        }
        if (!body || typeof body !== "object") {
          return jsonResponse({ error: "Missing or invalid JSON body for get-price" }, 400);
        }

        const NON_OPTION_KEYS = new Set(["copies", "designs", "deliveryPromise", "options"]);
        let options: Record<string, unknown>;
        if (body.options && typeof body.options === "object" && !Array.isArray(body.options)) {
          options = body.options as Record<string, unknown>;
        } else {
          options = {};
          for (const [k, v] of Object.entries(body)) {
            if (!NON_OPTION_KEYS.has(k)) {
              options[k] = v;
            }
          }
        }

        const pricePayload: Record<string, unknown> = {
          ...options,
          copies: Number(body.copies) || 1,
          designs: Number(body.designs) || 1,
          deliveryPromise: Number(body.deliveryPromise) || 0,
        };

        const optionKeys = Object.keys(options);
        console.log(`[proxy] get-price sku=${sku} optionKeys=${optionKeys.length} payload=${JSON.stringify(pricePayload).substring(0, 500)}`);

        if (optionKeys.length === 0) {
          return jsonResponse({ error: "Missing options for pricing — configure at least one product option" }, 400);
        }

        return proxyRequest("POST", `/products/${sku}/price`, pricePayload, lang);
      }

      case "get-accessories": {
        const sku = url.searchParams.get("sku");
        if (!sku) return jsonResponse({ error: "sku required" }, 400);
        return proxyRequest("GET", `/accessories/${sku}`, null, lang);
      }

      case "batch-specs":
        return proxyRequest("POST", "/products/batch/specs", body, lang);

      case "shippable-countries":
        return proxyRequest("GET", "/shipping/shippable-countries", null, lang);

      case "shipping-possibilities":
        return proxyRequest("POST", "/shipping/shipping-possibilities", body, lang);

      case "combined-shipment":
        return proxyRequest("POST", "/shipping/combined-shipment", body, lang);

      case "create-order":
        return proxyRequest("POST", "/orders", body, lang);

      case "list-orders":
        return proxyRequest("GET", "/orders", null, lang);

      case "get-order": {
        const orderNumber = url.searchParams.get("orderNumber");
        if (!orderNumber) return jsonResponse({ error: "orderNumber required" }, 400);
        return proxyRequest("GET", `/orders/${orderNumber}`, null, lang);
      }

      case "update-order": {
        const orderNumber = url.searchParams.get("orderNumber");
        if (!orderNumber) return jsonResponse({ error: "orderNumber required" }, 400);
        return proxyRequest("PUT", `/orders/${orderNumber}`, body, lang);
      }

      case "pdf-preflight":
        return proxyRequest("POST", "/pdf/preflight", body, lang);

      case "pdf-preview": {
        const file = url.searchParams.get("file");
        if (!file) return jsonResponse({ error: "file required" }, 400);
        return proxyRequest("GET", `/pdf/preview/${file}`, null, lang);
      }

      case "pdf-links": {
        const platformUrl = url.searchParams.get("platformUrl");
        if (!platformUrl) return jsonResponse({ error: "platformUrl required" }, 400);
        return proxyRequest("GET", `/pdf/links/${encodeURIComponent(platformUrl)}`, null, lang);
      }

      default:
        return jsonResponse({
          error: "Unknown action",
          availableActions: [
            "list-products", "get-product", "get-price", "get-accessories",
            "batch-specs", "shippable-countries", "shipping-possibilities",
            "combined-shipment", "create-order", "list-orders", "get-order",
            "update-order", "pdf-preflight", "pdf-preview", "pdf-links",
          ],
        }, 400);
    }
  } catch (error) {
    console.error("[proxy] Unhandled error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});

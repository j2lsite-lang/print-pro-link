const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getApiKey(): string {
  const apiKey = Deno.env.get("PRINTCOM_API_KEY");
  if (!apiKey) {
    throw new Error("PRINTCOM_API_KEY not configured");
  }
  return apiKey;
}

// In-memory JWT cache (v3 - production)
let cachedJwt: { token: string; expiresAt: number } | null = null;

async function getJwtToken(): Promise<string> {
  // Return cached token if still valid (with 60s margin)
  if (cachedJwt && cachedJwt.expiresAt > Date.now() + 60_000) {
    return cachedJwt.token;
  }

  const username = Deno.env.get("PRINTCOM_USERNAME");
  const password = Deno.env.get("PRINTCOM_PASSWORD");

  if (!username || !password) {
    throw new Error("PRINTCOM_USERNAME or PRINTCOM_PASSWORD not configured");
  }

  const apiBase = Deno.env.get("PRINTCOM_API_BASE") || "https://api.print.com";
  const loginUrl = `${apiBase}/login`;

  console.log(`[proxy] Logging in to ${loginUrl} with user: ${username}`);
  const res = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ credentials: { username, password } }),
  });

  const text = await res.text();
  console.log(`[proxy] Login response ${res.status}: ${text.substring(0, 300)}`);

  if (!res.ok) {
    throw new Error(`Login failed [${res.status}]: ${text}`);
  }

  const data = JSON.parse(text);
  const token = data.token || data.jwt || data.accessToken;
  if (!token) {
    throw new Error(`Login response missing token: ${text.substring(0, 200)}`);
  }

  // Cache for 23 hours (tokens usually last 24h)
  cachedJwt = { token, expiresAt: Date.now() + 23 * 60 * 60 * 1000 };
  return token;
}

async function proxyRequest(
  method: string,
  path: string,
  body: unknown | null,
  lang: string,
): Promise<Response> {
  const apiBase = Deno.env.get("PRINTCOM_API_BASE") || "https://api.print.com";
  const platformBase = Deno.env.get("PRINTCOM_PLATFORM_BASE") || "https://platform.print.com";

  const isPlatform = path.startsWith("/pdf/") || path.startsWith("/products/batch/");
  const baseUrl = isPlatform ? platformBase : apiBase;
  const url = `${baseUrl}${path}`;

  // Use JWT Bearer for POST/PUT (required for price, orders etc.)
  // Use PrintApiKey for GET requests
  let authHeader: string;
  if (method !== "GET") {
    const jwt = await getJwtToken();
    authHeader = `Bearer ${jwt}`;
  } else {
    const apiKey = getApiKey();
    authHeader = `PrintApiKey ${apiKey}`;
  }

  const headers: Record<string, string> = {
    Authorization: authHeader,
    "Accept-Language": lang,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const fetchOptions: RequestInit = { method, headers };
  if (body && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  console.log(`[proxy] ${method} ${url}`);
  if (body) console.log(`[proxy] body: ${JSON.stringify(body).substring(0, 500)}`);
  const res = await fetch(url, fetchOptions);
  const text = await res.text();
  console.log(`[proxy] response ${res.status}: ${text.substring(0, 500)}`);

  return new Response(text, {
    status: res.status,
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
      try {
        body = await req.json();
      } catch {
        body = null;
      }
    }

    switch (action) {
      case "list-products":
        return proxyRequest("GET", "/products", null, lang);

      case "get-product": {
        const sku = url.searchParams.get("sku");
        if (!sku)
          return new Response(JSON.stringify({ error: "sku required" }), {
            status: 400,
            headers: corsHeaders,
          });
        return proxyRequest("GET", `/products/${sku}`, null, lang);
      }

      case "get-price": {
        const sku = url.searchParams.get("sku");
        if (!sku)
          return new Response(JSON.stringify({ error: "sku required" }), {
            status: 400,
            headers: corsHeaders,
          });
        return proxyRequest("POST", `/products/${sku}/price`, body, lang);
      }

      case "get-accessories": {
        const sku = url.searchParams.get("sku");
        if (!sku)
          return new Response(JSON.stringify({ error: "sku required" }), {
            status: 400,
            headers: corsHeaders,
          });
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
        if (!orderNumber)
          return new Response(JSON.stringify({ error: "orderNumber required" }), {
            status: 400,
            headers: corsHeaders,
          });
        return proxyRequest("GET", `/orders/${orderNumber}`, null, lang);
      }

      case "update-order": {
        const orderNumber = url.searchParams.get("orderNumber");
        if (!orderNumber)
          return new Response(JSON.stringify({ error: "orderNumber required" }), {
            status: 400,
            headers: corsHeaders,
          });
        return proxyRequest("PUT", `/orders/${orderNumber}`, body, lang);
      }

      case "pdf-preflight":
        return proxyRequest("POST", "/pdf/preflight", body, lang);

      case "pdf-preview": {
        const file = url.searchParams.get("file");
        if (!file)
          return new Response(JSON.stringify({ error: "file required" }), {
            status: 400,
            headers: corsHeaders,
          });
        return proxyRequest("GET", `/pdf/preview/${file}`, null, lang);
      }

      case "pdf-links": {
        const platformUrl = url.searchParams.get("platformUrl");
        if (!platformUrl)
          return new Response(JSON.stringify({ error: "platformUrl required" }), {
            status: 400,
            headers: corsHeaders,
          });
        return proxyRequest("GET", `/pdf/links/${encodeURIComponent(platformUrl)}`, null, lang);
      }

      default:
        return new Response(
          JSON.stringify({
            error: "Unknown action",
            availableActions: [
              "list-products", "get-product", "get-price", "get-accessories",
              "batch-specs", "shippable-countries", "shipping-possibilities",
              "combined-shipment", "create-order", "list-orders", "get-order",
              "update-order", "pdf-preflight", "pdf-preview", "pdf-links",
            ],
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }
  } catch (error) {
    console.error("[proxy] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

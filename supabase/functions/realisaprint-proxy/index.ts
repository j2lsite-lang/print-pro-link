// realisaprint-proxy v1 – Proxy for Realisaprint.com API
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

const API_BASE = "https://www.realisaprint.com/api";

async function callRealisaprint(
  endpoint: string,
  extraParams: Record<string, string> = {},
): Promise<Response> {
  const shopId = Deno.env.get("REALISAPRINT_SHOP_ID");
  const apiKey = Deno.env.get("REALISAPRINT_API_KEY");

  if (!shopId || !apiKey) {
    return jsonResponse({ error: "REALISAPRINT credentials not configured" }, 500);
  }

  const params = new URLSearchParams({
    shop_id: shopId,
    api_key: apiKey,
    ...extraParams,
  });

  const url = `${API_BASE}/${endpoint}`;
  console.log(`[realisaprint] POST ${url} params=${JSON.stringify(Object.keys(extraParams))}`);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const text = await res.text();
  console.log(`[realisaprint] response ${res.status} (${text.length} bytes)`);

  if (!res.ok) {
    console.warn(`[realisaprint] error ${res.status}: ${text.substring(0, 500)}`);
  }

  return new Response(text, {
    status: res.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Build form params for variables array: variables[VARTICLE_XXX]=value
function buildVariableParams(variables: Record<string, string>): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(variables)) {
    params[`variables[${key}]`] = value;
  }
  return params;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    console.log(`[realisaprint] action=${action} method=${req.method}`);

    let body: Record<string, unknown> | null = null;
    if (req.method === "POST" || req.method === "PUT") {
      try {
        body = await req.json();
      } catch {
        body = null;
      }
    }

    switch (action) {
      // 1. List products
      case "products":
        return callRealisaprint("products");

      // 2. Get product configurations (options)
      case "configurations": {
        const product = url.searchParams.get("product");
        if (!product) return jsonResponse({ error: "product ID required" }, 400);
        return callRealisaprint("configurations", { product });
      }

      // 3. Show/hide variables based on current selection
      case "show_variables": {
        const product = url.searchParams.get("product");
        const stock = url.searchParams.get("stock");
        if (!product || !stock) return jsonResponse({ error: "product and stock required" }, 400);
        
        const variables = (body?.variables || {}) as Record<string, string>;
        const retry = body?.retry ? "1" : "";
        
        const params: Record<string, string> = {
          product,
          stock,
          ...buildVariableParams(variables),
        };
        if (retry) params.retry = retry;
        
        return callRealisaprint("show_variables", params);
      }

      // 4. Save configuration → get a code
      case "save_configuration": {
        const product = url.searchParams.get("product");
        const stock = url.searchParams.get("stock");
        if (!product || !stock) return jsonResponse({ error: "product and stock required" }, 400);
        
        const variables = (body?.variables || {}) as Record<string, string>;
        
        return callRealisaprint("save_configuration", {
          product,
          stock,
          ...buildVariableParams(variables),
        });
      }

      // 5. Get price for a configuration code
      case "get_price": {
        const code = url.searchParams.get("code");
        if (!code) return jsonResponse({ error: "code required" }, 400);
        
        const params: Record<string, string> = { code };
        const quantity = url.searchParams.get("quantity");
        if (quantity) params.quantity = quantity;
        const country = url.searchParams.get("country") || "FR";
        params.country = country;
        
        return callRealisaprint("get_price", params);
      }

      // 6. Get configuration details
      case "config_details": {
        const code = url.searchParams.get("code");
        if (!code) return jsonResponse({ error: "code required" }, 400);
        return callRealisaprint("config_details", { code });
      }

      // 7. Create order
      case "create_order": {
        if (!body) return jsonResponse({ error: "POST body required" }, 400);
        
        const params: Record<string, string> = {};
        const fields = [
          "code", "quantity", "control_file", "reference",
          "company", "name", "surname", "phone", "email",
          "address", "zip", "city", "country",
        ];
        for (const f of fields) {
          if (body[f] != null) params[f] = String(body[f]);
        }
        
        return callRealisaprint("create_order", params);
      }

      // 8. Get order info
      case "get_order": {
        const reference = url.searchParams.get("reference");
        if (!reference) return jsonResponse({ error: "reference required" }, 400);
        return callRealisaprint("get_order_info", { reference });
      }

      // 9. ISO countries
      case "get_iso_countries":
        return callRealisaprint("get_iso_countries");

      // 10. Get product from URL
      case "get_product_from_url": {
        const productUrl = url.searchParams.get("url");
        if (!productUrl) return jsonResponse({ error: "url required" }, 400);
        return callRealisaprint("get_product_from_url", { url: productUrl });
      }

      default:
        return jsonResponse({
          error: "Unknown action",
          availableActions: [
            "products", "configurations", "show_variables",
            "save_configuration", "get_price", "config_details",
            "create_order", "get_order", "get_iso_countries",
            "get_product_from_url",
          ],
        }, 400);
    }
  } catch (error) {
    console.error("[realisaprint] Unhandled error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});

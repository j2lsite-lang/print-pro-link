// printcom-proxy – Proxy for Print.com API
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, requireUser, isAdminUser } from "../_shared/admin-auth.ts";

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
  const apiBase = "https://api.print.com";
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
    const bodyStr = JSON.stringify(body);
    console.log(`[PrintCom] Body: ${bodyStr.substring(0, 500)}`);
    fetchOptions.body = bodyStr;
  }

  console.log(`[PrintCom] ${method} ${url}`);
  const res = await fetch(url, fetchOptions);
  const responseBody = await res.text();
  console.log(`[PrintCom] ${res.status} (${responseBody.length} bytes)`);
  if (res.status >= 400) {
    console.log(`[PrintCom] Error response: ${responseBody.substring(0, 500)}`);
  }

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

/**
 * Returns an error Response when the caller may NOT touch this order,
 * or null when access is granted (owner, admin or internal service role).
 */
async function assertOrderAccess(req: Request, orderNumber: string): Promise<Response | null> {
  const auth = await requireUser(req);
  if (!auth.ok) return jsonError(auth.error!, auth.status!);
  if (auth.isServiceRole) return null;
  if (auth.userId && (await isAdminUser(auth.userId))) return null;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data } = await admin
    .from("orders")
    .select("id")
    .eq("printcom_order_number", orderNumber)
    .eq("user_id", auth.userId!)
    .maybeSingle();

  if (!data) return jsonError("Order not found", 404);
  return null;
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

        const rawBody = body as Record<string, any> | null;
        if (!rawBody) return jsonError("body required for get-price");

        const { urgency, ...options } = rawBody;
        // Ensure copies is a number
        if (options.copies !== undefined) {
          options.copies = Number(options.copies);
        }
        const priceBody = {
          sku,
          options,
          deliveryPromise: urgency === "express" ? 1 : 0,
        };

        return proxyRequest("POST", `/products/${sku}/price`, priceBody, lang);
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

      // ── Orders (authenticated only) ──
      case "create-order": {
        const auth = await requireUser(req);
        if (!auth.ok) return jsonError(auth.error!, auth.status!);
        return proxyRequest("POST", "/orders", body, lang);
      }

      case "list-orders": {
        const auth = await requireAdmin(req);
        if (!auth.ok) return jsonError(auth.error!, auth.status!);
        return proxyRequest("GET", "/orders", null, lang);
      }

      case "get-order": {
        const orderNumber = url.searchParams.get("orderNumber");
        if (!orderNumber) return jsonError("orderNumber required");
        const owned = await assertOrderAccess(req, orderNumber);
        if (owned) return owned;
        return proxyRequest("GET", `/orders/${orderNumber}`, null, lang);
      }

      case "update-order": {
        const orderNumber = url.searchParams.get("orderNumber");
        if (!orderNumber) return jsonError("orderNumber required");
        const owned = await assertOrderAccess(req, orderNumber);
        if (owned) return owned;
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

      case "get-categories":
        return proxyRequest("GET", "/categories", null, lang);

      case "get-catalog":
        return proxyRequest("GET", "/catalog", null, lang);

      case "get-cms": {
        const cmsRes = await fetch("https://app.print.com/reseller/fr_cms.json");
        const cmsBody = await cmsRes.text();
        return new Response(cmsBody, {
          status: cmsRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get-product-images": {
        const sku = url.searchParams.get("sku");
        if (!sku) return jsonError("sku required");
        return proxyRequest("GET", `/products/${sku}/images`, null, lang);
      }

      default:
        return jsonError(`Unknown action: ${action}.`);
    }
  } catch (error) {
    console.error("[PrintCom] Unhandled error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(message, 500);
  }
});

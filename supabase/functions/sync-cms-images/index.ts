import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CMS_JSON_URL = "https://app.print.com/reseller/en_cms.json";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log("[sync-cms-images] Fetching CMS JSON...");
    const res = await fetch(CMS_JSON_URL);
    if (!res.ok) {
      throw new Error(`Failed to fetch CMS JSON: ${res.status}`);
    }

    const cms = await res.json();
    console.log("[sync-cms-images] CMS JSON fetched, top-level keys:", Object.keys(cms));

    // Assets map: id -> url
    const assets: Record<string, string> = {};
    if (cms.asset) {
      for (const [id, val] of Object.entries(cms.asset as Record<string, any>)) {
        if (val?.file) {
          const url = val.file.startsWith("//") ? `https:${val.file}` : val.file;
          assets[id] = url;
        }
      }
    }
    console.log(`[sync-cms-images] Found ${Object.keys(assets).length} assets`);

    // Look for product entries with SKUs and image references
    // Structure: { id: "assetId", type: "asset" }
    const skuImageMap: Record<string, { image_url: string; thumbnail_url?: string }> = {};

    const productSection = cms.product || {};
    let productCount = 0;

    for (const [, entry] of Object.entries(productSection as Record<string, any>)) {
      const sku = entry?.sku;
      if (!sku) continue;

      let imageUrl: string | null = null;
      let thumbnailUrl: string | null = null;

      // Helper to resolve an asset reference { id, type: "asset" } or string id
      const resolveRef = (ref: any): string | null => {
        if (!ref) return null;
        if (typeof ref === "string") return assets[ref] || null;
        if (ref?.type === "asset" && ref?.id) return assets[ref.id] || null;
        if (ref?.sys?.id) return assets[ref.sys.id] || null;
        return null;
      };

      // Try single image fields first
      for (const field of ["image", "thumbnail", "photo", "mainImage", "productImage", "icon"]) {
        const url = resolveRef(entry[field]);
        if (url) { imageUrl = url; break; }
      }

      // Try images array
      if (!imageUrl && Array.isArray(entry.images) && entry.images.length > 0) {
        imageUrl = resolveRef(entry.images[0]);
        if (entry.images.length > 1) {
          thumbnailUrl = resolveRef(entry.images[1]);
        }
      }

      if (imageUrl) {
        skuImageMap[sku] = { image_url: imageUrl, ...(thumbnailUrl ? { thumbnail_url: thumbnailUrl } : {}) };
        productCount++;
      }
    }

    console.log(`[sync-cms-images] Found ${productCount} products with images`);

    // Log a sample of what we found
    const sampleSkus = Object.keys(skuImageMap).slice(0, 5);
    console.log("[sync-cms-images] Sample SKUs:", JSON.stringify(sampleSkus));

    // Return summary of the CMS structure to help debug
    const sectionStats: Record<string, number> = {};
    for (const [key, val] of Object.entries(cms)) {
      if (typeof val === "object" && !Array.isArray(val)) {
        sectionStats[key] = Object.keys(val as object).length;
      }
    }

    if (Object.keys(skuImageMap).length === 0) {
      // Return structure info for debugging
      return new Response(
        JSON.stringify({
          success: false,
          message: "No SKU→image mappings found. CMS JSON structure:",
          sections: sectionStats,
          sampleAssets: Object.entries(assets).slice(0, 3).map(([id, url]) => ({ id, url })),
          sampleProductKeys: productSection ? Object.keys(productSection).slice(0, 3) : [],
          sampleProductEntry: productSection ? Object.values(productSection)[0] : null,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert into product_images table
    const rows = Object.entries(skuImageMap).map(([sku, { image_url, thumbnail_url }]) => ({
      sku,
      image_url,
      thumbnail_url: thumbnail_url || null,
      source: "printcom_cms",
    }));

    // Process in batches of 100
    let upserted = 0;
    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100);
      const { error } = await supabase
        .from("product_images")
        .upsert(batch, { onConflict: "sku" });
      if (error) {
        console.error("[sync-cms-images] Upsert error:", error);
        throw new Error(`DB upsert failed: ${error.message}`);
      }
      upserted += batch.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: upserted,
        message: `${upserted} product images synchronized from Print.com CMS`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[sync-cms-images] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch CMS JSON
    console.log("[sync-images] Fetching CMS JSON...");
    const cmsRes = await fetch("https://app.print.com/reseller/fr_cms.json");
    if (!cmsRes.ok) throw new Error("Failed to fetch CMS JSON: " + cmsRes.status);
    const cms = await cmsRes.json();

    const assets: Record<string, { title?: string; file?: string }> = cms.asset || {};
    const products: Record<string, any> = cms.product || {};

    console.log(`[sync-images] ${Object.keys(assets).length} assets, ${Object.keys(products).length} products`);

    // 2. Build image records per SKU
    const records: { sku: string; image_url: string; thumbnail_url: string; source: string }[] = [];

    for (const product of Object.values(products)) {
      const sku = product.sku;
      if (!sku) continue;

      // Main image (icon) as thumbnail
      let thumbnailUrl: string | null = null;
      if (product.icon?.id && assets[product.icon.id]?.file) {
        thumbnailUrl = "https:" + assets[product.icon.id].file;
      } else if (product.image?.id && assets[product.image.id]?.file) {
        thumbnailUrl = "https:" + assets[product.image.id].file;
      }

      // Gallery images (excluding icon to avoid duplicates)
      const galleryUrls: string[] = [];
      const iconAssetId = product.icon?.id || product.image?.id || null;
      if (product.images && Array.isArray(product.images)) {
        for (const img of product.images) {
          if (img.id && assets[img.id]?.file && img.id !== iconAssetId) {
            galleryUrls.push("https:" + assets[img.id].file);
          }
        }
      }

      // Build ordered list: icon/main image FIRST, then gallery
      const orderedImages: string[] = [];
      if (thumbnailUrl) orderedImages.push(thumbnailUrl);
      orderedImages.push(...galleryUrls);

      for (let idx = 0; idx < orderedImages.length; idx++) {
        records.push({
          sku,
          image_url: orderedImages[idx],
          thumbnail_url: thumbnailUrl || orderedImages[idx],
          source: "printcom_cms",
          sort_order: idx,
        });
      }
    }

    console.log(`[sync-images] ${records.length} image records to upsert`);

    // 3. Clear old CMS images and insert new ones
    const { error: delErr } = await supabase
      .from("product_images")
      .delete()
      .eq("source", "printcom_cms");
    if (delErr) console.error("[sync-images] Delete error:", delErr.message);

    // Insert in batches of 500
    let inserted = 0;
    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error: insErr } = await supabase.from("product_images").insert(batch);
      if (insErr) {
        console.error(`[sync-images] Insert error batch ${i / batchSize + 1}:`, insErr.message);
      } else {
        inserted += batch.length;
      }
    }

    console.log(`[sync-images] Done. Inserted ${inserted} records.`);

    return new Response(
      JSON.stringify({
        success: true,
        totalProducts: Object.keys(products).length,
        totalImages: inserted,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[sync-images] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

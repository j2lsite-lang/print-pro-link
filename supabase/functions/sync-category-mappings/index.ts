import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CmsProduct {
  sku?: string;
  icon?: { id: string };
  [key: string]: unknown;
}

interface CmsGroup {
  slug: string;
  name: string;
  products?: { type: string; id: string }[];
  groupImage?: { type: string; id: string };
  [key: string]: unknown;
}

/**
 * Deterministic sync of product→category mappings from Print.com CMS.
 * No AI involved — reads fr_cms.json and maps groups to local DB categories.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch CMS JSON
    console.log("[sync-mappings] Fetching CMS JSON...");
    const cmsRes = await fetch("https://app.print.com/reseller/fr_cms.json");
    if (!cmsRes.ok) throw new Error("Failed to fetch CMS JSON: " + cmsRes.status);
    const cms = await cmsRes.json();

    const groups: Record<string, CmsGroup> = cms.productGroup || {};
    const products: Record<string, CmsProduct> = cms.product || {};
    const assets: Record<string, { file?: string }> = cms.asset || {};

    console.log(`[sync-mappings] ${Object.keys(groups).length} groups, ${Object.keys(products).length} products`);

    // 2. Fetch local categories from DB
    const { data: categories, error: catErr } = await supabase
      .from("product_categories")
      .select("id, name, slug, parent_id")
      .order("sort_order");
    if (catErr) throw new Error("Failed to fetch categories: " + catErr.message);

    // 3. Build CMS slug → local category ID mapping
    // We match CMS group slugs to local category slugs using a manual mapping table
    // plus fuzzy name matching as fallback
    const cmsSlugToLocalId: Record<string, string> = {};

    // Manual mapping: CMS group slug → local DB slug
    const manualMap: Record<string, string> = {
      // Textiles
      "clothing": "vetements",
      "baby-textiles": "produits-bebes",
      "sportswear": "textiles-sport",
      "bath-textiles": "textiles-bain",
      "kitchen-living-textiles": "cuisine-sejour",
      "clothing-accesories": "accessoires",
      "transfers": "marquage-transferts-textiles",
      // Publicité intérieure
      "roller-banners": "roll-ups",
      "stand-walls": "stands-materiel-expo",
      "indoor-furniture": "mobilier-interieur",
      "decoration": "toiles-textiles-deco-interieure",
      "displays-pos-material": "presentoirs-materiel-plv",
      "rigids": "panneaux-accessoires-int",
      // Publicité extérieure
      "flags-outdoor": "drapeaux-beachflags-accessoires",
      "beachflags": "drapeaux-beachflags-accessoires",
      "pole-flags": "drapeaux-beachflags-accessoires",
      "banners-outdoor": "bannieres-structures-fixation",
      "banners": "bannieres-structures-fixation",
      "signs-banners": "stop-trottoirs-panneaux",
      "accessories-for-panels": "panneaux-accessoires-ext",
      // Grand format
      "textile": "toiles-textiles",
      "banner": "baches-banderoles",
      "vinyl": "films-adhesifs",
      "lookbooks": "lookbooks",
      // Impression
      "flyers-folders-posters": "flyers-depliants-affiches",
      "cards-envelopes": "cartes-visite-enveloppes",
      "office-print": "papeterie",
      "hospitality-industry": "catering-restaurants",
      "brochures-magazines": "brochures-magazines",
      "calendars": "calendriers",
      // Autocollants
      "on-roll": "autocollants-rouleaux",
      "loose-stickers": "petits-autocollants",
      "large-stickers": "autocollants-grand-format",
      "tapes": "rubans-adhesifs",
      // Emballages
      "shipping-packaging": "emballages-expedition",
      "gift-packaging": "emballages-cadeaux",
      "food-packaging": "emballages-alimentaires",
      "bags": "sacs-tote-bags",
      // Objets publicitaires
      "writing": "articles-papeterie",
      "other-writing": "articles-papeterie",
      "goodies-games": "general",
      "office-theme": "general",
      "events-merchandise": "general",
      "merchandise": "general",
      "give-aways-indoor-events": "general",
      "gift-sets": "general",
      "foods-beverages": "nourriture-boissons",
      "drinkware": "verrerie-vaisselle-gourdes",
      "gadgets": "gadgets",
      "wellness": "bien-etre",
      "seasonality-goodies": "saisonnalite",
      "gifts-merchandise-promotional": "general",
    };

    const localSlugToId: Record<string, string> = {};
    for (const cat of categories!) {
      localSlugToId[cat.slug] = cat.id;
    }

    for (const [cmsSlug, localSlug] of Object.entries(manualMap)) {
      if (localSlugToId[localSlug]) {
        cmsSlugToLocalId[cmsSlug] = localSlugToId[localSlug];
      }
    }

    console.log(`[sync-mappings] ${Object.keys(cmsSlugToLocalId).length} CMS→local mappings configured`);

    // 4. Collect SKUs per local category
    function collectSkus(groupSlug: string, seen: Set<string> = new Set()): Set<string> {
      const grp = Object.values(groups).find((g) => g.slug === groupSlug);
      if (!grp) return new Set();
      const skus = new Set<string>();
      for (const item of grp.products || []) {
        if (item.type === "product" && products[item.id]?.sku) {
          skus.add(products[item.id].sku!);
        } else if (item.type === "productGroup" && groups[item.id] && !seen.has(item.id)) {
          seen.add(item.id);
          const childSlug = groups[item.id].slug;
          if (childSlug) {
            for (const s of collectSkus(childSlug, seen)) {
              skus.add(s);
            }
          }
        }
      }
      return skus;
    }

    // 5. Build all mappings
    const allMappings: { sku: string; category_id: string }[] = [];
    const parentIds = new Set(categories!.filter(c => c.parent_id === null).map(c => c.id));

    for (const [cmsSlug, localCatId] of Object.entries(cmsSlugToLocalId)) {
      const skus = collectSkus(cmsSlug);
      for (const sku of skus) {
        allMappings.push({ sku, category_id: localCatId });

        // Also add to parent category
        const cat = categories!.find(c => c.id === localCatId);
        if (cat?.parent_id && parentIds.has(cat.parent_id)) {
          allMappings.push({ sku, category_id: cat.parent_id });
        }
      }
    }

    // Deduplicate
    const uniqueKey = (m: { sku: string; category_id: string }) => `${m.sku}|${m.category_id}`;
    const seen = new Set<string>();
    const dedupedMappings = allMappings.filter(m => {
      const k = uniqueKey(m);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    console.log(`[sync-mappings] ${dedupedMappings.length} unique mappings to upsert`);

    // 6. Clear existing mappings and insert fresh ones
    const { error: delErr } = await supabase
      .from("product_category_mappings")
      .delete()
      .neq("sku", "__placeholder__");
    if (delErr) console.error("[sync-mappings] Delete error:", delErr.message);

    // Insert in batches of 500
    let inserted = 0;
    const batchSize = 500;
    for (let i = 0; i < dedupedMappings.length; i += batchSize) {
      const batch = dedupedMappings.slice(i, i + batchSize);
      const { error: insErr } = await supabase
        .from("product_category_mappings")
        .upsert(batch, { onConflict: "sku,category_id" });
      if (insErr) {
        console.error(`[sync-mappings] Insert batch ${i / batchSize + 1} error:`, insErr.message);
      } else {
        inserted += batch.length;
      }
    }

    // 7. Also update category images from CMS groupImage
    let imagesUpdated = 0;
    for (const [cmsSlug, localCatId] of Object.entries(cmsSlugToLocalId)) {
      const grp = Object.values(groups).find(g => g.slug === cmsSlug);
      if (!grp?.groupImage?.id) continue;
      const asset = assets[grp.groupImage.id];
      if (!asset?.file) continue;
      const imageUrl = "https:" + asset.file;
      const { error: updErr } = await supabase
        .from("product_categories")
        .update({ image_url: imageUrl })
        .eq("id", localCatId);
      if (!updErr) imagesUpdated++;
    }

    const result = {
      success: true,
      totalMappings: inserted,
      imagesUpdated,
      cmsGroups: Object.keys(groups).length,
      cmsProducts: Object.keys(products).length,
    };

    console.log("[sync-mappings] Done:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[sync-mappings] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

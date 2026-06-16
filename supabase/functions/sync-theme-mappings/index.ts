import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CmsProduct {
  sku?: string;
  [key: string]: unknown;
}

interface CmsTile {
  product?: { type: string; id: string };
  urlToPreset?: string;
  [key: string]: unknown;
}

interface CmsGroup {
  slug: string;
  name: string;
  products?: { type: string; id: string }[];
  groupImage?: { type: string; id: string };
  imageThumbnail?: { type: string; id: string };
  [key: string]: unknown;
}

interface CmsMenu {
  slug: string;
  name: string;
  items?: { type: string; id: string }[];
}

/**
 * Deterministic sync of product→theme mappings from the Print.com CMS.
 * Reads the French "themes-fr" menu (the themes shown at
 * app.print.com/catalogue/themes) and links each theme to its products.
 *
 * Themes are an ADDITIONAL browse axis: it never touches categories,
 * mappings, prices or the ×1.5 coefficient. Every theme SKU is intersected
 * with the existing public catalogue so every product page/configurator works.
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
    console.log("[sync-themes] Fetching CMS JSON...");
    const cmsRes = await fetch("https://app.print.com/reseller/fr_cms.json");
    if (!cmsRes.ok) throw new Error("Failed to fetch CMS JSON: " + cmsRes.status);
    const cms = await cmsRes.json();

    const groups: Record<string, CmsGroup> = cms.productGroup || {};
    const products: Record<string, CmsProduct> = cms.product || {};
    const tiles: Record<string, CmsTile> = cms.tile || {};
    const assets: Record<string, { file?: string }> = cms.asset || {};
    const menus: Record<string, CmsMenu> = cms.menu || {};

    // 2. Locate the French themes menu.
    const themeMenu = Object.values(menus).find((m) => m.slug === "themes-fr") ||
      Object.values(menus).find((m) => m.slug === "themes");
    if (!themeMenu) throw new Error("No themes menu found in CMS");

    const themeGroups = (themeMenu.items || [])
      .map((it) => groups[it.id])
      .filter((g): g is CmsGroup => !!g && !!g.slug);

    console.log(`[sync-themes] ${themeGroups.length} themes in ${themeMenu.slug}`);

    // 3. Resolve every product reference (product / tile / nested productGroup) to a SKU.
    function collectSkus(refs: { type: string; id: string }[] | undefined, seen: Set<string>): Set<string> {
      const out = new Set<string>();
      for (const ref of refs || []) {
        if (seen.has(ref.id)) continue;
        seen.add(ref.id);
        if (ref.type === "product") {
          const p = products[ref.id];
          if (p?.sku) out.add(p.sku);
        } else if (ref.type === "tile") {
          const t = tiles[ref.id];
          if (t) {
            if (t.product && products[t.product.id]?.sku) {
              out.add(products[t.product.id].sku!);
            } else if (t.urlToPreset) {
              const m = t.urlToPreset.match(/\/selector\/([^?]+)/);
              if (m) out.add(m[1]);
            }
          }
        } else if (ref.type === "productGroup") {
          const g = groups[ref.id];
          if (g) for (const s of collectSkus(g.products, seen)) out.add(s);
        }
      }
      return out;
    }

    // 4. Public catalogue SKU set — guarantees every linked product has a working page.
    const publicSkus = new Set<string>();
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from("product_category_mappings")
        .select("sku")
        .range(from, from + 999);
      if (error) throw new Error("Failed to read public catalogue: " + error.message);
      const rows = data || [];
      rows.forEach((r) => publicSkus.add(r.sku as string));
      if (rows.length < 1000) break;
    }
    console.log(`[sync-themes] ${publicSkus.size} public SKUs in catalogue`);

    // 5. Upsert theme rows + collect valid mappings.
    const allMappings: { sku: string; theme_id: string }[] = [];
    const perTheme: { slug: string; name: string; valid: number; total: number }[] = [];
    let sortOrder = 0;

    for (const g of themeGroups) {
      const name = (g.name || g.slug).trim();
      const slug = g.slug.trim();

      // image
      let imageUrl: string | null = null;
      const imgRef = g.groupImage || g.imageThumbnail;
      if (imgRef?.id && assets[imgRef.id]?.file) {
        imageUrl = "https:" + assets[imgRef.id].file;
      }

      const { data: themeRow, error: upErr } = await supabase
        .from("product_themes")
        .upsert(
          { name, slug, image_url: imageUrl, sort_order: sortOrder++ },
          { onConflict: "slug" },
        )
        .select("id")
        .single();
      if (upErr || !themeRow) {
        console.error(`[sync-themes] upsert theme ${slug} failed:`, upErr?.message);
        continue;
      }

      const skus = collectSkus(g.products, new Set());
      const valid = [...skus].filter((s) => publicSkus.has(s));
      for (const sku of valid) allMappings.push({ sku, theme_id: themeRow.id });

      perTheme.push({ slug, name, valid: valid.length, total: skus.size });
    }

    // 6. Remove themes no longer in the menu (and their mappings cascade).
    const activeSlugs = themeGroups.map((g) => g.slug.trim());
    const { data: existingThemes } = await supabase.from("product_themes").select("id, slug");
    const staleIds = (existingThemes || [])
      .filter((t) => !activeSlugs.includes(t.slug))
      .map((t) => t.id);
    if (staleIds.length > 0) {
      await supabase.from("product_themes").delete().in("id", staleIds);
    }

    // 7. Rebuild mappings: clear then insert (dedup via UNIQUE(sku, theme_id)).
    const { error: delErr } = await supabase
      .from("product_theme_mappings")
      .delete()
      .neq("sku", "__placeholder__");
    if (delErr) console.error("[sync-themes] Delete error:", delErr.message);

    let inserted = 0;
    const batchSize = 500;
    for (let i = 0; i < allMappings.length; i += batchSize) {
      const batch = allMappings.slice(i, i + batchSize);
      const { error: insErr } = await supabase
        .from("product_theme_mappings")
        .upsert(batch, { onConflict: "sku,theme_id" });
      if (insErr) {
        console.error(`[sync-themes] Insert batch ${i / batchSize + 1}:`, insErr.message);
      } else {
        inserted += batch.length;
      }
    }

    const result = {
      success: true,
      menu: themeMenu.slug,
      themes: perTheme.length,
      totalMappings: inserted,
      staleThemesRemoved: staleIds.length,
      perTheme: perTheme.sort((a, b) => b.valid - a.valid),
    };
    console.log("[sync-themes] Done:", JSON.stringify(result));
    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[sync-themes] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

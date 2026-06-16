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
      "umbrellas": "accessoires",
      "hoodies": "vetements",
      "sweaters": "vetements",
      "polos": "vetements",
      "t-shirts": "vetements",
      "hoodies-premium": "vetements",
      "hoodies-basic": "vetements",
      "hoodies-budget": "vetements",
      "sweaters-premium": "vetements",
      "sweaters-basic": "vetements",
      "sweaters-budget": "vetements",
      "polos-premium": "vetements",
      "polos-basic": "vetements",
      "polos-budget": "vetements",
      "t-shirts-premium": "vetements",
      "t-shirts-basic": "vetements",
      "t-shirts-budget": "vetements",
      "fruit-of-the-loom": "vetements",
      "gildan": "vetements",
      "russell": "vetements",
      "clique": "vetements",
      "teejays": "vetements",
      "jack-and-jones": "vetements",
      "stanley-stella": "vetements",
      "b-and-c": "vetements",
      // Publicité intérieure
      "roller-banners": "roll-ups",
      "stand-walls": "stands-materiel-expo",
      "expo-furniture": "stands-materiel-expo",
      "stand-furniture": "stands-materiel-expo",
      "stand-decoration": "stands-materiel-expo",
      "indoor-furniture": "mobilier-interieur",
      "decoration": "toiles-textiles-deco-interieure",
      "wall-decoration": "toiles-textiles-deco-interieure",
      "photo-frames": "toiles-textiles-deco-interieure",
      "acoustic": "toiles-textiles-deco-interieure",
      "textile-frames": "toiles-textiles-deco-interieure",
      "wallpaper": "toiles-textiles-deco-interieure",
      "banner-frames": "toiles-textiles-deco-interieure",
      "displays-pos-material": "presentoirs-materiel-plv",
      "card-holders": "presentoirs-materiel-plv",
      "rigids": "panneaux-accessoires",
      "rigids-accessories": "panneaux-accessoires",
      // Publicité extérieure
      "flags-outdoor": "drapeaux-beachflags-accessoires",
      "beachflags": "drapeaux-beachflags-accessoires",
      "pole-flags": "drapeaux-beachflags-accessoires",
      "pole-flag-accessories": "drapeaux-beachflags-accessoires",
      "banners-outdoor": "bannieres-structures-fixation",
      "banners": "bannieres-structures-fixation",
      "signs-banners": "stop-trottoirs-panneaux",
      "pavement-signs": "stop-trottoirs-panneaux",
      "accessories-for-panels": "panneaux-accessoires-ext",
      "outdoor-furniture": "tonnelles-mobilier-exterieur",
      "deckchairs": "tonnelles-mobilier-exterieur",
      // Grand format
      "textile": "toiles-textiles",
      "banner": "baches-banderoles",
      "vinyl": "films-adhesifs",
      "lookbooks": "lookbooks",
      // Panneaux & accessoires (parent cat) — panneaux rigides + matériaux
      "materials-samples": "panneaux-accessoires",
      // Impression
      "flyers-folders-posters": "flyers-depliants-affiches",
      "cards-envelopes": "cartes-visite-enveloppes",
      "businesscards": "cartes-visite-enveloppes",
      "envelopes": "cartes-visite-enveloppes",
      "cards": "cartes-visite-enveloppes",
      "office-print": "papeterie",
      "hospitality-industry": "catering-restaurants",
      "brochures-magazines": "brochures-magazines",
      "softcovers": "brochures-magazines",
      "calendars": "calendriers",
      "direct-mail-activation": "courriers-creatifs",
      // Autocollants
      "on-roll": "autocollants-rouleaux",
      "loose-stickers": "petits-autocollants",
      "large-stickers": "autocollants-grand-format",
      "tapes": "rubans-adhesifs",
      "sticker-accessories": "accessoires-autocollants",
      // Films adhésifs (par type) — in stickers parent
      "stickers-tapes": "films-adhesifs-type",
      // Emballages
      "shipping-packaging": "emballages-expedition",
      "gift-packaging": "emballages-cadeaux",
      "food-packaging": "emballages-alimentaires",
      "bags": "sacs-tote-bags",
      // Objets publicitaires
      "writing": "articles-papeterie",
      "other-writing": "articles-papeterie",
      "pencils": "articles-papeterie",
      "notebooks": "articles-papeterie",
      "goodies-games": "general",
      "office-theme": "general",
      "events-merchandise": "general",
      "merchandise": "general",
      "give-aways-indoor-events": "general",
      "gift-sets": "general",
      "keychains": "general",
      "openers": "general",
      "foods-beverages": "nourriture-boissons",
      "drinkware": "verrerie-vaisselle-gourdes",
      "glass-tableware": "verrerie-vaisselle-gourdes",
      "water-bottles": "verrerie-vaisselle-gourdes",
      "thermos-bottles": "verrerie-vaisselle-gourdes",
      "gadgets": "gadgets",
      "wellness": "bien-etre",
      "seasonality-goodies": "saisonnalite",
      "easter": "saisonnalite",
      "valentine": "saisonnalite",
      "summer-goodies": "saisonnalite",
      "summer-theme": "saisonnalite",
      "winter-christmas": "saisonnalite",
      "christmas": "saisonnalite",
      "gifts-merchandise-promotional": "general",
      "new-and-updated": "general",
    };

    // ── Per-SKU manual classification ──────────────────────────────────────
    // The Print.com API exposes ~977 orderable products, but 116 are not placed
    // in any CMS productGroup (99 have NO group, 17 are only in themed groups
    // such as feestdagenshop-fr / sustainable). The audit (validated) found 79
    // real sellable products among them. They are classified here by SKU →
    // local sub-category slug so they appear in the catalogue without relying on
    // CMS groups. Unicity key stays the SKU, so no duplicate product page is
    // created. Slugs below all exist in product_categories.
    const SKU_MANUAL_CATEGORY: Record<string, string> = {
      // Verrerie, vaisselle, gourdes & boissons
      "allegra-wine-glass-35cl": "verrerie-vaisselle-gourdes",
      "gibraltar-stackable-glass-30cl": "verrerie-vaisselle-gourdes",
      "classico-longdrink-glass-32cl": "verrerie-vaisselle-gourdes",
      "boerke-beer-glass-33cl": "verrerie-vaisselle-gourdes",
      "americano-medio": "verrerie-vaisselle-gourdes",
      "reusable-cups-all-over": "verrerie-vaisselle-gourdes",
      "as-drinking-bottle": "verrerie-vaisselle-gourdes",
      "aluminum-bottle-with-carabiner": "verrerie-vaisselle-gourdes",
      "wine-cooler": "verrerie-vaisselle-gourdes",
      "wine-set": "verrerie-vaisselle-gourdes",
      "beer-crate": "verrerie-vaisselle-gourdes",
      "cap-opener": "gadgets",
      "gingerbread-in-can": "nourriture-boissons",
      "chocolate-letter-sleeve": "nourriture-boissons",
      "scented-candles": "gadgets",
      "face-paint-stick": "general",
      "portable-electrical-fans": "gadgets",
      "sunglasses-flag": "general",
      "quartet-cards": "general",
      // Stylos & articles de papeterie
      "pen-baron": "articles-papeterie",
      "pen-senator-nature-plus": "articles-papeterie",
      "pen-senator-super-hit-eco": "articles-papeterie",
      "pen-contour-rpet": "articles-papeterie",
      "pen-apollo-hardcolor": "articles-papeterie",
      "pen-kific-r-abs": "articles-papeterie",
      "happy-hardcolor-pen": "articles-papeterie",
      // Grand format, adhésifs, panneaux & déco
      "carwrap": "films-adhesifs",
      "geckotex": "films-adhesifs",
      "chrome-pet-vinyl": "films-adhesifs",
      "static-film": "films-adhesifs",
      "biond-vinyl": "films-adhesifs",
      "dibond-coating": "panneaux-accessoires",
      "forex-re": "panneaux-accessoires",
      "hd-metal-prints": "toiles-textiles-deco-interieure",
      "ceramic-tiles": "toiles-textiles-deco-interieure",
      "window-curtains": "toiles-textiles-deco-interieure",
      "duvet-covers": "cuisine-sejour",
      "tablecloth-indoor": "cuisine-sejour",
      // Signalétique & PLV
      "garden-signs": "panneaux-accessoires-ext",
      "facade-letters": "panneaux-accessoires-ext",
      "election-boards": "panneaux-accessoires-ext",
      "snap-frames-waterproof": "panneaux-accessoires-ext",
      "pavement-signs-water-tank-premium": "stop-trottoirs-panneaux",
      "foldable-led-frames": "presentoirs-materiel-plv",
      "led-frame-counters": "presentoirs-materiel-plv",
      "sign-holder-deluxe": "presentoirs-materiel-plv",
      "inhaker-folder-displays": "presentoirs-materiel-plv",
      "easels": "presentoirs-materiel-plv",
      "info-stands-deluxe": "stands-materiel-expo",
      "hanging-banners": "stands-materiel-expo",
      "telescopic-backdrops": "stands-materiel-expo",
      "hockers-cardboard": "mobilier-interieur",
      "stick-flags": "drapeaux-beachflags-accessoires",
      "steel-plate-17": "drapeaux-beachflags-accessoires",
      "inhaker-caps-baseplate": "drapeaux-beachflags-accessoires",
      // Textiles & accessoires
      "christmas-sweater": "vetements",
      "softshell-jacket-with-hood": "vetements",
      "trainings-vest": "textiles-sport",
      "headbands": "accessoires",
      "double-knit-thinsulate-hats": "accessoires",
      "textile-stickers": "marquage-transferts-textiles",
      // Emballages & sacs
      "shipping-boxes": "emballages-expedition",
      "paper-mailbag": "emballages-expedition",
      "paper-mailbag-inkjet": "emballages-expedition",
      "paper-bag-flat-loop-digital": "sacs-tote-bags",
      "lunch-boxes": "emballages-alimentaires",
      "carrying-trays": "emballages-alimentaires",
      "slider-boxes": "emballages-cadeaux",
      "wine-hang-tags": "emballages-cadeaux",
      // Impression papier
      "election-flyers-fr": "flyers-depliants-affiches",
      "election-posters-fr": "flyers-depliants-affiches",
      "tickets": "flyers-depliants-affiches",
      "raffle-tickets": "flyers-depliants-affiches",
      "tear-off-calendars": "calendriers",
      "printed-binder-filler": "papeterie",
      "clipboard-mdf": "catering-restaurants",
      // Stickers & accessoires
      "fluor-stickers": "petits-autocollants",
      "adhesive-hanger": "accessoires-autocollants",
      // Saisonnalité
      "inhaker-christmas-tree": "saisonnalite",
    };

    // ── Non-customer SKUs to ALWAYS exclude ────────────────────────────────
    // Sample books (lookbooks), internal samples, mounting templates and
    // consumables that Print.com exposes via the API but must NOT be shown as
    // customer products. Excluded by EXACT SKU only (never by a name containing
    // "sample"). 37 references, validated by the audit.
    const EXCLUDED_NON_CUSTOMER_SKUS = new Set<string>([
      "print-lookbook", "print-lookbook-contents-only", "coated-print-lookbook",
      "uncoated-print-lookbook", "eco-print-lookbook", "special-print-lookbook",
      "finishes-print-lookbook",                          // Lookbooks Print (livres d'échantillons)
      "sign-lookbook", "sign-lookbook-contents-only", "paper-sign-lookbook",
      "laminate-sign-lookbook", "vinyl-sign-lookbook", "textiles-sign-lookbook",
      "wall-coverings-sign-lookbook", "banners-sign-lookbook", // Lookbooks Sign
      "rigid-lookbook", "rigid-lookbook-contents-only", "box1-rigid-lookbook",
      "box2-rigid-lookbook", "box3-rigid-lookbook", "box4-rigid-lookbook", // Lookbooks Rigids
      "mail-lookbook", "mail-lookbook-contents-only", "cards-mail-lookbook",
      "envelopes-mail-lookbook",                          // Lookbooks Mail
      "covers-lookbook", "inspire-lookbook", "refill-lookbook", "set-lookbooks", // Lookbooks divers
      "samples-internal", "acrylox-sample-chain",         // Échantillons internes
      "mounting-template",                                // Gabarit de montage
      "nylon-spacers-glue",                               // Consommable (colle)
      "posterclamp", "popup-wall-feet", "umbrella-base-45", "signing", // Accessoires techniques exclus (audit)
    ]);

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

    const pushWithParent = (sku: string, localCatId: string) => {
      allMappings.push({ sku, category_id: localCatId });
      const cat = categories!.find(c => c.id === localCatId);
      if (cat?.parent_id && parentIds.has(cat.parent_id)) {
        allMappings.push({ sku, category_id: cat.parent_id });
      }
    };

    for (const [cmsSlug, localCatId] of Object.entries(cmsSlugToLocalId)) {
      const skus = collectSkus(cmsSlug);
      for (const sku of skus) pushWithParent(sku, localCatId);
    }

    // 5b. Per-SKU manual classification (products with no/themed CMS group).
    let manualSkuApplied = 0;
    for (const [sku, localSlug] of Object.entries(SKU_MANUAL_CATEGORY)) {
      const localCatId = localSlugToId[localSlug];
      if (!localCatId) {
        console.warn(`[sync-mappings] unknown slug for ${sku}: ${localSlug}`);
        continue;
      }
      pushWithParent(sku, localCatId);
      manualSkuApplied++;
    }
    console.log(`[sync-mappings] ${manualSkuApplied} per-SKU manual mappings applied`);

    // 5c. Fetch the live API active-SKU set to drop stale mappings (SKUs the
    //     supplier no longer returns from GET /products). If the call fails we
    //     SKIP filtering to avoid accidentally emptying the catalogue.
    let activeSkus: Set<string> | null = null;
    try {
      const apiKey = Deno.env.get("PRINTCOM_API_KEY");
      if (apiKey) {
        const apiRes = await fetch("https://api.print.com/products", {
          headers: { Authorization: `PrintApiKey ${apiKey}`, "Accept-Language": "fr-FR" },
        });
        if (apiRes.ok) {
          const arr = await apiRes.json();
          if (Array.isArray(arr)) {
            activeSkus = new Set(arr.filter((p) => p?.active !== false && p?.sku).map((p) => p.sku as string));
          }
        }
      }
    } catch (e) {
      console.warn("[sync-mappings] could not fetch active SKUs, skipping stale filter:", e);
    }

    // 5d. Apply exclusions (non-customer SKUs) and stale filter.
    const filteredMappings = allMappings.filter((m) => {
      if (EXCLUDED_NON_CUSTOMER_SKUS.has(m.sku)) return false;
      if (activeSkus && !activeSkus.has(m.sku)) return false; // stale (retiré du fournisseur)
      return true;
    });

    // Deduplicate (unicity = sku + category_id; no duplicate product page)
    const uniqueKey = (m: { sku: string; category_id: string }) => `${m.sku}|${m.category_id}`;
    const seen = new Set<string>();
    const dedupedMappings = filteredMappings.filter(m => {
      const k = uniqueKey(m);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    console.log(`[sync-mappings] ${dedupedMappings.length} unique mappings (activeFilter=${activeSkus ? "on" : "off"}) to upsert`);


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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const PRINTCOM_API_KEY = Deno.env.get("PRINTCOM_API_KEY");
    if (!PRINTCOM_API_KEY) throw new Error("PRINTCOM_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse optional parameters
    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }
    const subcategoriesOnly = body.subcategoriesOnly === true;
    const startFrom = body.startFrom || 0;

    // 1. Fetch ALL categories (parents + subcategories) from DB
    const { data: categories, error: catErr } = await supabase
      .from("product_categories")
      .select("id, name, slug, description, parent_id")
      .order("sort_order");
    if (catErr) throw new Error("Failed to fetch categories: " + catErr.message);

    // Build category info for AI prompt
    const categoryList = categories!.map((c: any) => {
      const parentName = c.parent_id
        ? categories!.find((p: any) => p.id === c.parent_id)?.name || ""
        : "";
      const label = parentName ? `${parentName} > ${c.name}` : c.name;
      return `- ${c.id}: ${label} (${c.description || ""})`;
    }).join("\n");

    // Filter which categories to map to
    const targetCategories = subcategoriesOnly
      ? categories!.filter((c: any) => c.parent_id !== null)
      : categories!;

    const targetCategoryList = targetCategories.map((c: any) => {
      const parentName = c.parent_id
        ? categories!.find((p: any) => p.id === c.parent_id)?.name || ""
        : "";
      const label = parentName ? `${parentName} > ${c.name}` : c.name;
      return `- ${c.id}: ${label} (${c.description || ""})`;
    }).join("\n");

    // 2. Fetch products from Print.com API
    const apiBase = Deno.env.get("PRINTCOM_API_BASE") || "https://api.print.com";
    const prodRes = await fetch(`${apiBase}/products`, {
      headers: {
        Authorization: `PrintApiKey ${PRINTCOM_API_KEY}`,
        "Accept-Language": "fr-FR",
        "Content-Type": "application/json",
      },
    });
    if (!prodRes.ok) throw new Error("Print.com API error: " + await prodRes.text());
    const products = await prodRes.json();
    const activeProducts = (Array.isArray(products) ? products : [])
      .filter((p: any) => p.active !== false)
      .map((p: any) => ({ sku: p.sku, title: p.titleSingle || p.titlePlural || p.sku }));

    console.log(`[map-categories] ${activeProducts.length} products, ${targetCategories.length} target categories, startFrom=${startFrom}`);

    // 3. Process in batches
    const batchSize = 50;
    let totalMapped = 0;

    for (let i = startFrom; i < activeProducts.length; i += batchSize) {
      const batch = activeProducts.slice(i, i + batchSize);
      const productList = batch.map((p: any) => `- ${p.sku}: ${p.title}`).join("\n");

      const prompt = `Tu es un expert en classification de produits d'impression et publicitaires.

Voici les catégories et sous-catégories disponibles (format: UUID: Nom (description)) :
${targetCategoryList}

Voici une liste de produits avec leur SKU et nom :
${productList}

Pour chaque produit, associe-le aux catégories ET sous-catégories les plus pertinentes.
Réponds UNIQUEMENT avec un JSON array, sans markdown, sans explication.
Format: [{"sku": "xxx", "category_ids": ["uuid1", "uuid2"]}]

Règles :
- Un produit peut appartenir à plusieurs catégories et sous-catégories
- Utilise les UUIDs exacts
- Sois précis : associe aux sous-catégories quand elles existent
- Si un produit a une sous-catégorie pertinente, associe-le aussi à sa catégorie parente
- Si un produit ne correspond à aucune catégorie, ne l'inclus pas`;

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!aiRes.ok) {
        const status = aiRes.status;
        if (status === 429) {
          console.warn("[map-categories] Rate limited, waiting 10s...");
          await new Promise((r) => setTimeout(r, 10000));
          i -= batchSize;
          continue;
        }
        if (status === 402) throw new Error("Lovable AI credits exhausted");
        throw new Error(`AI error [${status}]: ${await aiRes.text()}`);
      }

      const aiData = await aiRes.json();
      const content = aiData.choices?.[0]?.message?.content || "";

      const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      let mappings: { sku: string; category_ids: string[] }[];
      try {
        mappings = JSON.parse(jsonStr);
      } catch {
        console.error("[map-categories] Failed to parse batch", i / batchSize + 1, content.substring(0, 200));
        continue;
      }

      const batchMappings: { sku: string; category_id: string }[] = [];
      const validIds = new Set(categories!.map((c: any) => c.id));
      for (const m of mappings) {
        for (const cid of m.category_ids) {
          if (validIds.has(cid)) {
            batchMappings.push({ sku: m.sku, category_id: cid });
          }
        }
      }

      if (batchMappings.length > 0) {
        const { error: insErr } = await supabase.from("product_category_mappings").upsert(batchMappings, {
          onConflict: "sku,category_id",
        });
        if (insErr) console.error("[map-categories] Insert error:", insErr.message);
        else totalMapped += batchMappings.length;
      }

      console.log(`[map-categories] Batch ${i / batchSize + 1}: ${mappings.length} products, ${totalMapped} total mappings`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalProducts: activeProducts.length,
        totalMappings: totalMapped,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[map-categories] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

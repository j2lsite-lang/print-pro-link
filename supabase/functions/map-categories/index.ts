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

    // 1. Fetch categories from DB
    const { data: categories, error: catErr } = await supabase
      .from("product_categories")
      .select("id, name, slug, description")
      .order("sort_order");
    if (catErr) throw new Error("Failed to fetch categories: " + catErr.message);

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

    console.log(`[map-categories] ${activeProducts.length} products, ${categories!.length} categories`);

    // 3. Clear existing mappings first
    await supabase.from("product_category_mappings").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // 4. Process in batches of 50 products and insert immediately
    const batchSize = 50;
    let totalMapped = 0;

    for (let i = 0; i < activeProducts.length; i += batchSize) {
      const batch = activeProducts.slice(i, i + batchSize);
      const productList = batch.map((p: any) => `- ${p.sku}: ${p.title}`).join("\n");
      const categoryList = categories!.map((c: any) => `- ${c.id}: ${c.name} (${c.description || ""})`).join("\n");

      const prompt = `Tu es un expert en classification de produits d'impression et publicitaires.

Voici les catégories disponibles :
${categoryList}

Voici une liste de produits avec leur SKU et nom :
${productList}

Pour chaque produit, associe-le à UNE ou PLUSIEURS catégories pertinentes.
Réponds UNIQUEMENT avec un JSON array, sans markdown, sans explication.
Format: [{"sku": "xxx", "category_ids": ["uuid1", "uuid2"]}]

Règles :
- Un produit peut appartenir à plusieurs catégories
- Utilise les UUIDs exacts des catégories
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
          i -= batchSize; // retry this batch
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
        console.error("[map-categories] Failed to parse AI response for batch", i, content.substring(0, 200));
        continue;
      }

      // Insert immediately after each batch
      const batchMappings: { sku: string; category_id: string }[] = [];
      for (const m of mappings) {
        for (const cid of m.category_ids) {
          if (categories!.some((c: any) => c.id === cid)) {
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

      console.log(`[map-categories] Batch ${i / batchSize + 1}: ${mappings.length} products mapped, ${totalMapped} total`);
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

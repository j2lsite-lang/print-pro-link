import { supabase } from "@/integrations/supabase/client";

export interface ProductCategoryMapping {
  sku: string;
  category_id: string;
}

const PAGE_SIZE = 1000;
let cachedMappings: ProductCategoryMapping[] | null = null;
let pendingMappings: Promise<ProductCategoryMapping[]> | null = null;

async function fetchMappingPage(from: number, to: number) {
  const { data, error } = await supabase
    .from("product_category_mappings")
    .select("sku, category_id")
    .order("sku", { ascending: true })
    .order("category_id", { ascending: true })
    .range(from, to);

  if (error) throw error;
  return (data || []) as ProductCategoryMapping[];
}

export async function fetchAllProductCategoryMappings(): Promise<ProductCategoryMapping[]> {
  if (cachedMappings) return cachedMappings;
  if (pendingMappings) return pendingMappings;

  pendingMappings = (async () => {
    const rows: ProductCategoryMapping[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const page = await fetchMappingPage(from, from + PAGE_SIZE - 1);
      rows.push(...page);
      if (page.length < PAGE_SIZE) break;
    }
    cachedMappings = rows;
    pendingMappings = null;
    return rows;
  })();

  return pendingMappings;
}

export async function fetchPublicCatalogSkuSet(): Promise<Set<string>> {
  const mappings = await fetchAllProductCategoryMappings();
  return new Set(mappings.map((mapping) => mapping.sku));
}
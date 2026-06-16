import { supabase } from "@/integrations/supabase/client";

export interface ProductThemeMapping {
  sku: string;
  theme_id: string;
}

const PAGE_SIZE = 1000;
let cachedMappings: ProductThemeMapping[] | null = null;
let pendingMappings: Promise<ProductThemeMapping[]> | null = null;

async function fetchMappingPage(from: number, to: number) {
  const { data, error } = await supabase
    .from("product_theme_mappings")
    .select("sku, theme_id")
    .order("sku", { ascending: true })
    .order("theme_id", { ascending: true })
    .range(from, to);

  if (error) throw error;
  return (data || []) as ProductThemeMapping[];
}

export async function fetchAllProductThemeMappings(): Promise<ProductThemeMapping[]> {
  if (cachedMappings) return cachedMappings;
  if (pendingMappings) return pendingMappings;

  pendingMappings = (async () => {
    const rows: ProductThemeMapping[] = [];
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

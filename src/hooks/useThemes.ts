import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllProductThemeMappings } from "@/lib/theme-mappings";

export interface ProductTheme {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
}

export function useThemes() {
  const [themes, setThemes] = useState<ProductTheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("product_themes")
      .select("*")
      .order("sort_order")
      .then(({ data, error }) => {
        if (!error && data) setThemes(data);
        setLoading(false);
      });
  }, []);

  return { themes, loading };
}

export function useThemeBySlug(slug: string | undefined) {
  const [theme, setTheme] = useState<ProductTheme | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    supabase
      .from("product_themes")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        setTheme(data);
        setLoading(false);
      });
  }, [slug]);

  return { theme, loading };
}

export function useSkusForTheme(themeId: string | undefined) {
  const [skus, setSkus] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!themeId) { setLoading(false); return; }

    async function fetchSkus() {
      const mappings = await fetchAllProductThemeMappings();
      const uniqueSkus = [...new Set(mappings.filter((m) => m.theme_id === themeId).map((m) => m.sku))];
      setSkus(uniqueSkus);
      setLoading(false);
    }

    fetchSkus();
  }, [themeId]);

  return { skus, loading };
}

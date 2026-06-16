import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllProductCategoryMappings } from "@/lib/catalog-mappings";

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
}

export function useCategories(parentId?: string | null) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = supabase
      .from("product_categories")
      .select("*")
      .order("sort_order");

    if (parentId === undefined) {
      // Top-level categories only
      query.is("parent_id", null);
    } else if (parentId) {
      query.eq("parent_id", parentId);
    }

    query.then(({ data, error }) => {
      if (!error && data) setCategories(data);
      setLoading(false);
    });
  }, [parentId]);

  return { categories, loading };
}

export function useCategoryBySlug(slug: string | undefined) {
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    supabase
      .from("product_categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        setCategory(data);
        setLoading(false);
      });
  }, [slug]);

  return { category, loading };
}

export function useSkusForCategory(categoryId: string | undefined) {
  const [skus, setSkus] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) { setLoading(false); return; }

    // Get SKUs from this category AND all its subcategories
    async function fetchSkus() {
      // First get subcategory IDs
      const { data: subCats } = await supabase
        .from("product_categories")
        .select("id")
        .eq("parent_id", categoryId!);

      const categoryIds = [categoryId!, ...(subCats?.map(s => s.id) || [])];

      const mappings = await fetchAllProductCategoryMappings();
      const categorySet = new Set(categoryIds);
      const uniqueSkus = [...new Set(mappings.filter((d) => categorySet.has(d.category_id)).map((d) => d.sku))];
      setSkus(uniqueSkus);
      setLoading(false);
    }

    fetchSkus();
  }, [categoryId]);

  return { skus, loading };
}

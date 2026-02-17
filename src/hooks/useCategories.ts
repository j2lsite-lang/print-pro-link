import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
      // Top-level categories
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
    supabase
      .from("product_category_mappings")
      .select("sku")
      .eq("category_id", categoryId)
      .then(({ data }) => {
        setSkus(data?.map((d) => d.sku) || []);
        setLoading(false);
      });
  }, [categoryId]);

  return { skus, loading };
}

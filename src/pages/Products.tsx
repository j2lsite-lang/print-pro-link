import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Loader2, Grid3x3, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listProducts } from "@/lib/printcom";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import fallbackProductImage from "@/assets/services/supports-publicitaires.jpg";

interface Product {
  sku: string;
  titleSingle?: string;
  titlePlural?: string;
  active?: boolean;
  thumbnailUrl?: string;
  cmsImageUrl?: string;
  categoryImageUrl?: string;
}

export default function Products() {
  const { categories, loading: catLoading } = useCategories();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAllProducts, setShowAllProducts] = useState(false);

  useEffect(() => {
    Promise.all([
      listProducts(),
      supabase.from("product_images").select("sku, image_url, thumbnail_url"),
      supabase.from("product_category_mappings").select("sku, category_id"),
      supabase.from("product_categories").select("id, image_url, parent_id"),
    ])
      .then(([data, { data: imgData }, { data: mappings }, { data: categoriesData }]) => {
        const items: Product[] = Array.isArray(data) ? data : data?.products || data?.items || [];

        const cmsImageBySku: Record<string, string> = {};
        for (const row of imgData || []) {
          cmsImageBySku[row.sku] = row.image_url || row.thumbnail_url || "";
        }

        const categoryMap: Record<string, { image_url: string | null; parent_id: string | null }> = {};
        for (const category of categoriesData || []) {
          categoryMap[category.id] = {
            image_url: category.image_url,
            parent_id: category.parent_id,
          };
        }

        const categoryImageBySku: Record<string, string> = {};
        for (const mapping of mappings || []) {
          if (categoryImageBySku[mapping.sku]) continue;

          const category = categoryMap[mapping.category_id];
          if (!category) continue;

          if (category.image_url) {
            categoryImageBySku[mapping.sku] = category.image_url;
            continue;
          }

          if (category.parent_id) {
            const parent = categoryMap[category.parent_id];
            if (parent?.image_url) {
              categoryImageBySku[mapping.sku] = parent.image_url;
            }
          }
        }

        setProducts(
          items.filter((p) => p.active !== false).map((p) => ({
            ...p,
            cmsImageUrl: cmsImageBySku[p.sku] || undefined,
            categoryImageUrl: categoryImageBySku[p.sku] || undefined,
          }))
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const title = (p.titleSingle || p.titlePlural || "").toLowerCase();
    return title.includes(q) || p.sku.toLowerCase().includes(q);
  });

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold text-foreground">Catalogue</h1>
      <p className="mt-2 text-muted-foreground">Découvrez tous nos produits d'impression et supports publicitaires.</p>

      {/* Categories */}
      {!catLoading && categories.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">Catégories</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products/category/${cat.slug}`}
                className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all hover:shadow-elevated hover:border-primary/30"
              >
                {cat.image_url ? (
                  <div className="aspect-[16/9] bg-muted">
                    <img src={cat.image_url} alt={cat.name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-muted flex items-center justify-center">
                    <Grid3x3 className="h-10 w-10 text-muted-foreground/20" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-display font-semibold text-card-foreground group-hover:text-primary transition-colors">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{cat.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Toggle all products */}
      <div className="mt-10 flex items-center gap-4">
        <Button
          variant={showAllProducts ? "default" : "outline"}
          onClick={() => setShowAllProducts(!showAllProducts)}
        >
          <List className="mr-2 h-4 w-4" />
          {showAllProducts ? "Masquer tous les produits" : "Voir tous les produits"}
        </Button>
      </div>

      {showAllProducts && (
        <>
          {/* Search */}
          <div className="mt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Content */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Chargement du catalogue…</span>
            </div>
          )}

          {error && (
            <div className="mt-8 rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
              <p className="text-sm text-destructive">Erreur : {error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product) => (
                <Link
                  key={product.sku}
                  to={`/products/${product.sku}`}
                  className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all hover:shadow-elevated"
                >
                  <div className="aspect-[4/3] bg-muted overflow-hidden">
                    <img
                      src={product.cmsImageUrl || product.categoryImageUrl || product.thumbnailUrl || fallbackProductImage}
                      alt={product.titleSingle || product.sku}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display font-semibold text-card-foreground group-hover:text-primary transition-colors">
                      {product.titleSingle || product.sku}
                    </h3>
                  </div>
                </Link>
              ))}
              {filtered.length === 0 && (
                <p className="col-span-full py-10 text-center text-muted-foreground">Aucun produit trouvé.</p>
              )}
            </div>
          )}

          <p className="mt-6 text-sm text-muted-foreground">
            {filtered.length} produit{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
          </p>
        </>
      )}
    </div>
  );
}

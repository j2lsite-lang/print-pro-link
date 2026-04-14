import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Loader2, Grid3x3, List, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listProducts } from "@/lib/printcom";
import { useCategories } from "@/hooks/useCategories";

interface Product {
  sku: string;
  name: string;
  thumbnailUrl?: string;
}

export default function Products() {
  const { categories, loading: catLoading } = useCategories();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAllProducts, setShowAllProducts] = useState(false);

  useEffect(() => {
    listProducts()
      .then((data) => {
        const items: Product[] = (Array.isArray(data) ? data : [])
          .filter((p: any) => p.active !== false)
          .map((p: any) => ({
            sku: p.sku,
            name: p.titleSingle || p.name || p.sku,
            thumbnailUrl: p.thumbnailUrl || p.thumbnail_url || null,
          }))
          .sort((a, b) => a.name.localeCompare(b.name, "fr"));

        setProducts(items);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return product.name.toLowerCase().includes(q) || product.sku.toLowerCase().includes(q);
    });
  }, [products, search]);

  const visibleCategories = categories;

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold text-foreground">Catalogue</h1>
      <p className="mt-2 text-muted-foreground">Découvrez tous nos produits d'impression et supports publicitaires.</p>

      {!catLoading && visibleCategories.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 font-display text-xl font-semibold text-foreground">Catégories</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products/category/${cat.slug}`}
                className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all hover:border-primary/30 hover:shadow-elevated"
              >
                {cat.image_url ? (
                  <div className="aspect-[16/9] bg-muted">
                    <img src={cat.image_url} alt={cat.name} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ) : (
                  <div className="flex aspect-[16/9] items-center justify-center bg-muted">
                    <Grid3x3 className="h-10 w-10 text-muted-foreground/20" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-display font-semibold text-card-foreground transition-colors group-hover:text-primary">
                    {cat.name}
                  </h3>
                  {cat.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{cat.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 flex items-center gap-4">
        <Button variant={showAllProducts ? "default" : "outline"} onClick={() => setShowAllProducts(!showAllProducts)}>
          <List className="mr-2 h-4 w-4" />
          {showAllProducts ? "Masquer tous les produits" : "Voir tous les produits"}
        </Button>
      </div>

      {showAllProducts && (
        <>
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
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product) => (
                <Link
                  key={product.sku}
                  to={`/products/${product.sku}`}
                  className="group rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/30 hover:shadow-elevated"
                >
                  {product.thumbnailUrl && (
                    <div className="aspect-[4/3] mb-3 rounded-lg overflow-hidden bg-muted">
                      <img src={product.thumbnailUrl} alt={product.name} className="h-full w-full object-contain p-2" loading="lazy" />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Produit J2L Print</p>
                      <h3 className="mt-3 font-display text-lg font-semibold text-card-foreground transition-colors group-hover:text-primary">
                        {product.name}
                      </h3>
                    </div>
                    <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
                    <span>Réf. {product.sku}</span>
                    <span>Configurer</span>
                  </div>
                </Link>
              ))}
              {filtered.length === 0 && <p className="col-span-full py-10 text-center text-muted-foreground">Aucun produit trouvé.</p>}
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

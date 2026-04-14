import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Loader2, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCatalogProducts, type CatalogProduct } from "@/lib/printcom";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";

interface Product extends CatalogProduct {}
...
  useEffect(() => {
    getCatalogProducts()
      .then(setProducts)
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

  return (
    <div className="container py-10">
      <p className="text-sm font-medium text-primary tracking-wide uppercase">Catalogue</p>
      <h1 className="mt-2 font-display text-4xl font-bold text-foreground">Catégories</h1>

      {catLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!catLoading && categories.length > 0 && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products/category/${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-elevated"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted/50">
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-5xl opacity-20">📦</span>
                  </div>
                )}
              </div>
              <div className="px-4 py-3.5 flex items-baseline justify-between gap-2">
                <h3 className="font-display text-sm font-semibold text-card-foreground transition-colors group-hover:text-primary truncate">
                  {cat.name}
                </h3>
                {categoryCounts[cat.id] != null && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    ({categoryCounts[cat.id]})
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10">
        <Button
          variant={showAllProducts ? "default" : "outline"}
          size="lg"
          onClick={() => setShowAllProducts(!showAllProducts)}
          className="rounded-full"
        >
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

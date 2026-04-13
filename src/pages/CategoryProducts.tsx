import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Search, Loader2, ChevronRight, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { listProducts } from "@/lib/realisaprint";
import { useCategoryBySlug, useCategories, useSkusForCategory } from "@/hooks/useCategories";

interface Product {
  id: string;
  name: string;
}

export default function CategoryProducts() {
  const { slug } = useParams<{ slug: string }>();
  const { category, loading: catLoading } = useCategoryBySlug(slug);
  const { categories: subCategories } = useCategories(category?.id || null);
  const { skus, loading: skusLoading } = useSkusForCategory(category?.id);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listProducts()
      .then((data) => {
        const productsObj = data?.products || {};
        const items = Object.entries(productsObj)
          .map(([id, name]) => ({ id, name: name as string }))
          .sort((a, b) => a.name.localeCompare(b.name, "fr"));

        setAllProducts(items);
      })
      .catch((err) => setError(err.message))
      .finally(() => setProductsLoading(false));
  }, []);

  const loading = catLoading || skusLoading || productsLoading;

  const categoryProducts = useMemo(() => {
    if (skus.length === 0) return [];
    return allProducts.filter((product) => skus.includes(product.id));
  }, [allProducts, skus]);

  const filtered = useMemo(() => {
    return categoryProducts.filter((product) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return product.name.toLowerCase().includes(q) || product.id.includes(q);
    });
  }, [categoryProducts, search]);

  if (catLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Catégorie introuvable.</p>
        <Link to="/products" className="mt-4 inline-block text-primary hover:underline">
          ← Retour au catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/products" className="transition-colors hover:text-foreground">Catalogue</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{category.name}</span>
      </nav>

      <h1 className="font-display text-3xl font-bold text-foreground">{category.name}</h1>
      {category.description && <p className="mt-2 max-w-3xl text-muted-foreground">{category.description}</p>}

      {subCategories.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {subCategories.map((sub) => (
            <Link
              key={sub.id}
              to={`/products/category/${sub.slug}`}
              className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-elevated"
            >
              <h3 className="font-display font-semibold text-card-foreground">{sub.name}</h3>
              {sub.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{sub.description}</p>}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans cette catégorie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Chargement…</span>
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">Erreur : {error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/30 hover:shadow-elevated"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Produit Realisaprint</p>
                    <h3 className="mt-3 font-display text-lg font-semibold text-card-foreground transition-colors group-hover:text-primary">
                      {product.name}
                    </h3>
                  </div>
                  <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
                  <span>Réf. {product.id}</span>
                  <span>Configurer</span>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && skus.length === 0 && (
            <p className="mt-8 py-10 text-center text-muted-foreground">Aucun produit associé à cette catégorie pour le moment.</p>
          )}

          {filtered.length === 0 && skus.length > 0 && <p className="mt-8 py-10 text-center text-muted-foreground">Aucun produit trouvé.</p>}

          <p className="mt-6 text-sm text-muted-foreground">
            {filtered.length} produit{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
          </p>
        </>
      )}
    </div>
  );
}
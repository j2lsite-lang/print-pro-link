import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Search, Loader2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { listProducts } from "@/lib/printcom";
import { useCategoryBySlug, useCategories, useSkusForCategory } from "@/hooks/useCategories";

interface Product {
  sku: string;
  titleSingle?: string;
  titlePlural?: string;
  active?: boolean;
  thumbnailUrl?: string;
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
        const items: Product[] = Array.isArray(data) ? data : data?.products || data?.items || [];
        setAllProducts(items.filter((p) => p.active !== false));
      })
      .catch((err) => setError(err.message))
      .finally(() => setProductsLoading(false));
  }, []);

  const loading = catLoading || skusLoading || productsLoading;

  // Filter products by SKUs in this category
  const categoryProducts = skus.length > 0
    ? allProducts.filter((p) => skus.includes(p.sku))
    : [];

  const filtered = categoryProducts.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const title = (p.titleSingle || p.titlePlural || "").toLowerCase();
    return title.includes(q) || p.sku.toLowerCase().includes(q);
  });

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
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/products" className="hover:text-foreground transition-colors">Catalogue</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{category.name}</span>
      </nav>

      <h1 className="font-display text-3xl font-bold text-foreground">{category.name}</h1>
      {category.description && (
        <p className="mt-2 text-muted-foreground">{category.description}</p>
      )}

      {/* Sub-categories */}
      {subCategories.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {subCategories.map((sub) => (
            <Link
              key={sub.id}
              to={`/products/category/${sub.slug}`}
              className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-elevated hover:border-primary/30"
            >
              <h3 className="font-display font-semibold text-card-foreground">{sub.name}</h3>
              {sub.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{sub.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Search */}
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

      {/* Products */}
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
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => (
              <Link
                key={product.sku}
                to={`/products/${product.sku}`}
                className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all hover:shadow-elevated"
              >
                <div className="aspect-[4/3] bg-muted">
                  {product.thumbnailUrl ? (
                    <img src={product.thumbnailUrl} alt={product.titleSingle || product.sku} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-4xl font-bold text-muted-foreground/20">{product.sku}</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold text-card-foreground group-hover:text-primary transition-colors">
                    {product.titleSingle || product.sku}
                  </h3>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && skus.length === 0 && (
            <p className="mt-8 py-10 text-center text-muted-foreground">
              Aucun produit associé à cette catégorie pour le moment.
              <br />
              <span className="text-xs">Les produits seront associés aux catégories prochainement.</span>
            </p>
          )}

          {filtered.length === 0 && skus.length > 0 && (
            <p className="mt-8 py-10 text-center text-muted-foreground">Aucun produit trouvé.</p>
          )}

          <p className="mt-6 text-sm text-muted-foreground">
            {filtered.length} produit{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
          </p>
        </>
      )}
    </div>
  );
}

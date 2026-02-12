import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { listProducts } from "@/lib/printcom";

interface Product {
  sku: string;
  name: string;
  category?: string;
  description?: string;
  thumbnailUrl?: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    listProducts()
      .then((data) => {
        const items = Array.isArray(data) ? data : data?.products || data?.items || [];
        setProducts(items);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold text-foreground">Catalogue</h1>
      <p className="mt-2 text-muted-foreground">Découvrez tous nos produits d'impression et supports publicitaires.</p>

      {/* Filters */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Toutes catégories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
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
          <p className="mt-2 text-xs text-muted-foreground">Vérifiez vos identifiants Print.com dans les secrets.</p>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <Link
              key={product.sku}
              to={`/products/${product.sku}`}
              className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all hover:shadow-elevated"
            >
              <div className="aspect-[4/3] bg-muted">
                {product.thumbnailUrl ? (
                  <img src={product.thumbnailUrl} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-4xl font-bold text-muted-foreground/20">{product.sku}</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-display font-semibold text-card-foreground group-hover:text-primary transition-colors">
                  {product.name || product.sku}
                </h3>
                {product.category && (
                  <span className="mt-1 inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                    {product.category}
                  </span>
                )}
              </div>
            </Link>
          ))}
          {filtered.length === 0 && !loading && (
            <p className="col-span-full py-10 text-center text-muted-foreground">Aucun produit trouvé.</p>
          )}
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Search, Loader2, ChevronRight, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getCatalogProducts, type CatalogProduct } from "@/lib/printcom";
import { supabase } from "@/integrations/supabase/client";
import { useThemeBySlug, useSkusForTheme } from "@/hooks/useThemes";
import { useSEO } from "@/hooks/useSEO";

interface Product extends CatalogProduct {}

export default function ThemeProducts() {
  const { slug } = useParams<{ slug: string }>();
  const { theme, loading: themeLoading } = useThemeBySlug(slug);
  const { skus, loading: skusLoading } = useSkusForTheme(theme?.id);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cmsThumbnails, setCmsThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    getCatalogProducts()
      .then(setAllProducts)
      .catch((err) => setError(err.message))
      .finally(() => setProductsLoading(false));
  }, []);

  useEffect(() => {
    if (skus.length === 0) return;
    supabase
      .from("product_images")
      .select("sku, thumbnail_url")
      .in("sku", skus)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string> = {};
        for (const row of data) {
          if (!map[row.sku] && row.thumbnail_url) map[row.sku] = row.thumbnail_url;
        }
        setCmsThumbnails(map);
      });
  }, [skus]);

  const loading = themeLoading || skusLoading || productsLoading;

  const BASE_URL = "https://j2lprint.fr";
  useSEO({
    title: theme ? `${theme.name} – Thème | J2L Print` : "Thème – J2L Print",
    description: theme
      ? `Découvrez les produits du thème ${theme.name} : impression professionnelle, devis gratuit et livraison rapide partout en France avec J2L Print.`
      : "Thème de produits J2L Print.",
    canonical: theme ? `${BASE_URL}/themes/${theme.slug}` : undefined,
    jsonLd: theme
      ? [
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE_URL}/` },
              { "@type": "ListItem", position: 2, name: "Thèmes", item: `${BASE_URL}/themes` },
              { "@type": "ListItem", position: 3, name: theme.name, item: `${BASE_URL}/themes/${theme.slug}` },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${theme.name} – J2L Print`,
            description: `Produits du thème ${theme.name}.`,
            url: `${BASE_URL}/themes/${theme.slug}`,
            isPartOf: { "@type": "WebSite", name: "J2L Print", url: BASE_URL },
          },
        ]
      : undefined,
  });

  const themeProducts = useMemo(() => {
    if (skus.length === 0) return [];
    const skuSet = new Set(skus);
    return allProducts.filter((product) => skuSet.has(product.sku));
  }, [allProducts, skus]);

  const filtered = useMemo(() => {
    return themeProducts.filter((product) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return product.name.toLowerCase().includes(q) || product.sku.toLowerCase().includes(q);
    });
  }, [themeProducts, search]);

  if (themeLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Thème introuvable.</p>
        <Link to="/themes" className="mt-4 inline-block text-primary hover:underline">
          ← Retour aux thèmes
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/products" className="transition-colors hover:text-foreground">Catalogue</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/themes" className="transition-colors hover:text-foreground">Thèmes</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{theme.name}</span>
      </nav>

      <h1 className="font-display text-3xl font-bold text-foreground">{theme.name}</h1>
      {theme.description && <p className="mt-2 max-w-3xl text-muted-foreground">{theme.description}</p>}

      <div className="mt-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans ce thème..."
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
                key={product.sku}
                to={`/products/${product.sku}`}
                className="group rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/30 hover:shadow-elevated"
              >
                {(cmsThumbnails[product.sku] || product.thumbnailUrl) && (
                  <div className="mb-3 aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                    <img
                      src={cmsThumbnails[product.sku] || product.thumbnailUrl || undefined}
                      alt={product.name}
                      className="h-full w-full object-contain p-2"
                      loading="lazy"
                    />
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
          </div>

          {filtered.length === 0 && skus.length === 0 && (
            <p className="mt-8 py-10 text-center text-muted-foreground">Aucun produit associé à ce thème pour le moment.</p>
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

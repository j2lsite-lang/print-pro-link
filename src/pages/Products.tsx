import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Loader2, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCatalogProducts, type CatalogProduct } from "@/lib/printcom";
import { useCategories } from "@/hooks/useCategories";
import { useThemes } from "@/hooks/useThemes";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { fetchAllProductCategoryMappings, fetchPublicCatalogSkuSet } from "@/lib/catalog-mappings";
import { fetchAllProductThemeMappings } from "@/lib/theme-mappings";
import { NOUVEAUTES_SKUS, BESTSELLER_SKUS } from "@/lib/catalog-sections";
import { searchProducts } from "@/lib/search";
import { isExcludedSku } from "@/config/excluded-products";

interface Product extends CatalogProduct {}

interface CategoryCount {
  [categoryId: string]: number;
}

export default function Products() {
  const { categories, loading: catLoading } = useCategories();
  const { themes, loading: themesLoading } = useThemes();
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount>({});
  const [themeCounts, setThemeCounts] = useState<Record<string, number>>({});
  const [sectionThumbnails, setSectionThumbnails] = useState<Record<string, string>>({});

  useSEO({
    title: "Catalogue produits – Impression en ligne",
    description: "Parcourez notre catalogue d'impression : flyers, cartes de visite, affiches, bâches, adhésifs, textiles, objets publicitaires. Commandez en ligne, livraison rapide en France.",
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAllProducts, setShowAllProducts] = useState(false);

  useEffect(() => {
    if (categories.length === 0) return;

    async function fetchCounts() {
      const { data: allCats } = await supabase
        .from("product_categories")
        .select("id, parent_id");

      const subCatMap: Record<string, string[]> = {};
      allCats?.forEach((c) => {
        if (c.parent_id) {
          if (!subCatMap[c.parent_id]) subCatMap[c.parent_id] = [];
          subCatMap[c.parent_id].push(c.id);
        }
      });

      const mappings = await fetchAllProductCategoryMappings();

      const counts: CategoryCount = {};
      for (const cat of categories) {
        const relatedIds = [cat.id, ...(subCatMap[cat.id] || [])];
        const uniqueSkus = new Set(
          mappings.filter((m) => relatedIds.includes(m.category_id)).map((m) => m.sku)
        );
        counts[cat.id] = uniqueSkus.size;
      }
      setCategoryCounts(counts);
    }

    fetchCounts();
  }, [categories]);

  useEffect(() => {
    if (themes.length === 0) return;
    fetchAllProductThemeMappings().then((mappings) => {
      const c: Record<string, number> = {};
      for (const t of themes) {
        c[t.id] = new Set(mappings.filter((m) => m.theme_id === t.id).map((m) => m.sku)).size;
      }
      setThemeCounts(c);
    });
  }, [themes]);

  useEffect(() => {
    Promise.all([getCatalogProducts(), fetchPublicCatalogSkuSet()])
      .then(([items, publicSkuSet]) =>
        setProducts(
          items.filter((product) => publicSkuSet.has(product.sku) && !isExcludedSku(product.sku)),
        ),
      )
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const skus = [...new Set([...NOUVEAUTES_SKUS, ...BESTSELLER_SKUS])];
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
        setSectionThumbnails(map);
      });
  }, []);




  const filtered = useMemo(() => {
    return searchProducts(products, search);
  }, [products, search]);

  const pickBySkus = (skus: string[]) => {
    const bySku = new Map(products.map((p) => [p.sku, p]));
    const out: Product[] = [];
    const seen = new Set<string>();
    for (const sku of skus) {
      const p = bySku.get(sku);
      if (p && !seen.has(sku)) {
        seen.add(sku);
        out.push(p);
      }
    }
    return out;
  };

  const nouveautes = useMemo(() => pickBySkus(NOUVEAUTES_SKUS), [products]);
  const bestSellers = useMemo(() => pickBySkus(BESTSELLER_SKUS), [products]);


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

      {!themesLoading && themes.length > 0 && (
        <section className="mt-16">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Collections</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-foreground">Thèmes</h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Parcourez le catalogue par thème pour trouver rapidement les produits adaptés à chaque occasion.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {themes.map((theme) => (
              <Link
                key={theme.id}
                to={`/themes/${theme.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-elevated"
              >
                <div className="aspect-[4/3] overflow-hidden bg-muted/50">
                  {theme.image_url ? (
                    <img
                      src={theme.image_url}
                      alt={theme.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-5xl opacity-20">🎨</span>
                    </div>
                  )}
                </div>
                <div className="px-4 py-3.5 flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-sm font-semibold text-card-foreground transition-colors group-hover:text-primary truncate">
                    {theme.name}
                  </h3>
                  {themeCounts[theme.id] != null && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      ({themeCounts[theme.id]})
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!loading && nouveautes.length > 0 && (
        <ProductSection
          eyebrow="Tout juste arrivés"
          title="Nouveautés"
          subtitle="Découvrez les derniers produits ajoutés au catalogue J2L Print."
          items={nouveautes}
          thumbnails={sectionThumbnails}
        />
      )}

      {!loading && bestSellers.length > 0 && (
        <ProductSection
          eyebrow="Les plus demandés"
          title="Nos best-sellers"
          subtitle="Les produits Print.com les plus commandés par nos clients."
          items={bestSellers}
          thumbnails={sectionThumbnails}
        />
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

function ProductSection({
  eyebrow,
  title,
  subtitle,
  items,
  thumbnails,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: Product[];
  thumbnails: Record<string, string>;
}) {
  return (
    <section className="mt-16">
      <p className="text-sm font-medium uppercase tracking-wide text-primary">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 max-w-3xl text-muted-foreground">{subtitle}</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((product) => {
          const imageUrl = thumbnails[product.sku] || product.thumbnailUrl;
          return (
          <Link
            key={product.sku}
            to={`/products/${product.sku}`}
            className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-elevated"
          >
            <div className="aspect-[4/3] overflow-hidden bg-muted/50">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-5xl opacity-20">📦</span>
                </div>
              )}
            </div>
            <div className="px-4 py-3.5">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Produit J2L Print</p>
              <h3 className="mt-1 truncate font-display text-sm font-semibold text-card-foreground transition-colors group-hover:text-primary">
                {product.name}
              </h3>
            </div>
          </Link>
          );
        })}
      </div>
    </section>
  );
}


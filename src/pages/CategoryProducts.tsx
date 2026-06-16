import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Search, Loader2, ChevronRight, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getCatalogProducts, type CatalogProduct } from "@/lib/printcom";
import { supabase } from "@/integrations/supabase/client";
import { useCategoryBySlug, useCategories, useSkusForCategory } from "@/hooks/useCategories";
import { useSEO } from "@/hooks/useSEO";
import { fetchAllProductCategoryMappings } from "@/lib/catalog-mappings";

interface Product extends CatalogProduct {}

export default function CategoryProducts() {
  const { slug } = useParams<{ slug: string }>();
  const { category, loading: catLoading } = useCategoryBySlug(slug);
  const { categories: subCategories } = useCategories(category?.id || null);
  const { skus, loading: skusLoading } = useSkusForCategory(category?.id);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cmsThumbnails, setCmsThumbnails] = useState<Record<string, string>>({});
  const [subCategoryCounts, setSubCategoryCounts] = useState<Record<string, number>>({});
  const [parentSlug, setParentSlug] = useState<string | null>(null);

  // Resolve the parent category slug so subcategory pages can point their
  // canonical at the matching new SEO URL (/categorie/{parent}/{child}).
  useEffect(() => {
    if (!category?.parent_id) { setParentSlug(null); return; }
    supabase
      .from("product_categories")
      .select("slug")
      .eq("id", category.parent_id)
      .maybeSingle()
      .then(({ data }) => setParentSlug(data?.slug ?? null));
  }, [category?.parent_id]);

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
          if (!map[row.sku] && row.thumbnail_url) {
            map[row.sku] = row.thumbnail_url;
          }
        }
        setCmsThumbnails(map);
      });
  }, [skus]);

  useEffect(() => {
    if (subCategories.length === 0) return;
    const subIds = subCategories.map((s) => s.id);
    fetchAllProductCategoryMappings()
      .then((mappings) => {
        const subIdSet = new Set(subIds);
        const data = mappings.filter((mapping) => subIdSet.has(mapping.category_id));
        const counts: Record<string, number> = {};
        for (const sub of subCategories) {
          const uniqueSkus = new Set(data.filter((m) => m.category_id === sub.id).map((m) => m.sku));
          counts[sub.id] = uniqueSkus.size;
        }
        setSubCategoryCounts(counts);
      });
  }, [subCategories]);

  const loading = catLoading || skusLoading || productsLoading;

  // Canonical points to the new SEO URL that supersedes this legacy page:
  // top categories -> /categorie/{slug}, subcategories -> /categorie/{parent}/{slug}
  const BASE_URL = "https://j2lprint.fr";
  const newPath = category
    ? category.parent_id
      ? parentSlug
        ? `/categorie/${parentSlug}/${category.slug}`
        : null
      : `/categorie/${category.slug}`
    : null;

  useSEO({
    title: category ? `${category.name} – Impression en ligne` : "Catégorie – J2L Print",
    description: category
      ? `Découvrez notre gamme ${category.name} : impression professionnelle, devis gratuit et livraison rapide partout en France. J2L Print, votre imprimerie en ligne.`
      : "Catégorie de produits J2L Print.",
    canonical: newPath ? `${BASE_URL}${newPath}` : undefined,
    jsonLd: category && newPath
      ? [
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE_URL}/` },
              { "@type": "ListItem", position: 2, name: "Catalogue", item: `${BASE_URL}/catalogue` },
              { "@type": "ListItem", position: 3, name: category.name, item: `${BASE_URL}${newPath}` },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${category.name} – J2L Print`,
            description: `Impression professionnelle : ${category.name}.`,
            url: `${BASE_URL}${newPath}`,
            isPartOf: { "@type": "WebSite", name: "J2L Print", url: BASE_URL },
          },
        ]
      : undefined,
  });

  const categoryProducts = useMemo(() => {
    if (skus.length === 0) return [];
    const skuSet = new Set(skus);
    return allProducts.filter((product) => skuSet.has(product.sku));
  }, [allProducts, skus]);

  const filtered = useMemo(() => {
    return categoryProducts.filter((product) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return product.name.toLowerCase().includes(q) || product.sku.toLowerCase().includes(q);
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
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {subCategories.map((sub) => (
            <Link
              key={sub.id}
              to={`/products/category/${sub.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-elevated"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted/50">
                {sub.image_url ? (
                  <img
                    src={sub.image_url}
                    alt={sub.name}
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
                  {sub.name}
                </h3>
                {subCategoryCounts[sub.id] != null && (
                  <span className="shrink-0 text-xs text-muted-foreground">({subCategoryCounts[sub.id]})</span>
                )}
              </div>
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
                key={product.sku}
                to={`/products/${product.sku}`}
                className="group rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/30 hover:shadow-elevated"
              >
                {(cmsThumbnails[product.sku] || product.thumbnailUrl) && (
                  <div className="aspect-[4/3] mb-3 rounded-lg overflow-hidden bg-muted">
                    <img src={cmsThumbnails[product.sku] || product.thumbnailUrl || undefined} alt={product.name} className="h-full w-full object-contain p-2" loading="lazy" />
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
            <p className="mt-8 py-10 text-center text-muted-foreground">Aucun produit associé à cette catégorie pour le moment.</p>
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

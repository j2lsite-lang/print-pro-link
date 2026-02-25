import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, Package, X, ZoomIn, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getProduct, getPrice, getAccessories } from "@/lib/printcom";
import { getResalePrice, DESIGN_FEE_BASE } from "@/lib/pricing";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import OptionSelector from "@/components/product/OptionSelector";
import PriceSummary from "@/components/product/PriceSummary";
import { humanizeSlug, translatePropertyTitle } from "@/lib/slug-translations";
import fallbackProductImage from "@/assets/services/supports-publicitaires.jpg";

interface ProductProperty {
  slug: string;
  title: string;
  required: boolean;
  locked: boolean;
  options: { slug: string | number | null; name?: string; nullable?: boolean; eco?: boolean; description?: string; type?: string }[];
}

interface PrintComProduct {
  sku: string;
  titleSingle?: string;
  titlePlural?: string;
  active?: boolean;
  properties?: ProductProperty[];
  thumbnailUrl?: string;
  imageUrl?: string;
}

function getPricingProperties(properties: ProductProperty[] = []): ProductProperty[] {
  const withOptions = properties.filter((p) => p.options?.some((o) => o.slug != null));
  const slugs = new Set(withOptions.map((p) => p.slug));

  // If both "material" and "material:material" exist, keep the base property.
  return withOptions.filter((prop) => {
    if (!prop.slug.includes(":")) return true;
    const baseSlug = prop.slug.split(":")[0];
    return !slugs.has(baseSlug);
  });
}

const MAIN_CONFIG_SLUGS = ["copies", "fold", "size", "material", "printtype", "finish"] as const;

function getMainConfiguratorProps(properties: ProductProperty[] = []): ProductProperty[] {
  const all = getPricingProperties(properties);
  const main = all.filter((p) => MAIN_CONFIG_SLUGS.includes(p.slug as (typeof MAIN_CONFIG_SLUGS)[number]));

  // Fallback for products without the standard slugs: keep the smallest meaningful set.
  if (main.length > 0) return main;
  return all.filter((p) => p.required || p.slug === "copies").slice(0, 7);
}

function parseMissingRequiredProperty(errorText: string): string | null {
  const frMatch = errorText.match(/propriété requise manquante\s*:?\s*([a-zA-Z0-9_:-]+)/i);
  if (frMatch?.[1]) return frMatch[1];

  const enMatch = errorText.match(/missing required property\s*:?\s*([a-zA-Z0-9_:-]+)/i);
  if (enMatch?.[1]) return enMatch[1];

  return null;
}

export default function ProductDetail() {
  const { sku } = useParams<{ sku: string }>();
  const { addItem } = useCart();
  const [imageZoom, setImageZoom] = useState(false);

  const [product, setProduct] = useState<PrintComProduct | null>(null);
  const [accessories, setAccessories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryImageUrl, setCategoryImageUrl] = useState<string | null>(null);
  const [includeDesignFee, setIncludeDesignFee] = useState(false);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const [priceResult, setPriceResult] = useState<any>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  useEffect(() => {
    if (!sku) return;
    setLoading(true);
    Promise.all([
      getProduct(sku).catch(() => null),
      getAccessories(sku).catch(() => []),
    ])
      .then(([prod, accs]) => {
        setProduct(prod);
        setAccessories(Array.isArray(accs) ? accs : accs?.accessories || []);
        if (prod?.properties) {
          const defaults: Record<string, string> = {};
          const visibleProps = getMainConfiguratorProps(prod.properties);

          // Preselect only the main visible options for a stable initial configuration
          for (const prop of visibleProps) {
            const firstOption = prop.options?.find((o) => o.slug != null);
            if (firstOption) {
              defaults[prop.slug] = String(firstOption.slug);
            }
          }
          setSelectedOptions(defaults);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    // Fetch product image: product image first, then category image, then parent category image
    supabase
      .from("product_images")
      .select("image_url, thumbnail_url")
      .eq("sku", sku)
      .maybeSingle()
      .then(({ data: imgData }) => {
        if (imgData?.image_url || imgData?.thumbnail_url) {
          setCategoryImageUrl(imgData.image_url || imgData.thumbnail_url || null);
          return;
        }

        return supabase
          .from("product_category_mappings")
          .select("category_id")
          .eq("sku", sku)
          .limit(1)
          .maybeSingle()
          .then(async ({ data: mapping }) => {
            if (!mapping?.category_id) return;

            const { data: category } = await supabase
              .from("product_categories")
              .select("image_url, parent_id")
              .eq("id", mapping.category_id)
              .maybeSingle();

            if (category?.image_url) {
              setCategoryImageUrl(category.image_url);
              return;
            }

            if (category?.parent_id) {
              const { data: parentCategory } = await supabase
                .from("product_categories")
                .select("image_url")
                .eq("id", category.parent_id)
                .maybeSingle();
              if (parentCategory?.image_url) {
                setCategoryImageUrl(parentCategory.image_url);
              }
            }
          });
      });
  }, [sku]);

  const allPricingProps = getPricingProperties(product?.properties || []);

  // Show only the main options in UI to avoid invalid auto-combinations.
  const configurableProps = getMainConfiguratorProps(product?.properties || []).filter(
    (p) => p.options?.length > 0
  );

  // Remove stale keys from previous payload strategies (prevents invalid option combos lingering in state).
  useEffect(() => {
    const allowed = new Set(configurableProps.map((p) => p.slug));
    setSelectedOptions((prev) => {
      const next = Object.fromEntries(
        Object.entries(prev).filter(([k, v]) => allowed.has(k) && v != null && v !== "")
      );
      const prevKeys = Object.keys(prev).sort().join("|");
      const nextKeys = Object.keys(next).sort().join("|");
      const sameValues = prevKeys === nextKeys && Object.keys(next).every((k) => prev[k] === next[k]);
      return sameValues ? prev : next;
    });
  }, [product?.sku, configurableProps.map((p) => p.slug).join("|")]);
  const buildPricePayload = (forcedOptions: Record<string, string | number> = {}) => {
    const options: Record<string, unknown> = {};
    const allowedSlugs = new Set(configurableProps.map((p) => p.slug));

    for (const [k, v] of Object.entries(selectedOptions)) {
      if (!allowedSlugs.has(k)) continue;
      if (v == null || v === "") continue;
      options[k] = k === "copies" ? Number(v) || 1 : v;
    }

    // Inject hidden required base properties (ex: printingmethod) to avoid first-call API errors.
    for (const prop of allPricingProps) {
      if (!prop.required || allowedSlugs.has(prop.slug) || prop.slug.includes(":")) continue;
      if (options[prop.slug]) continue;
      const firstOption = prop.options?.find((o) => o.slug != null);
      if (firstOption) {
        options[prop.slug] = prop.slug === "copies" ? Number(firstOption.slug) || 1 : String(firstOption.slug);
      }
    }

    for (const [k, v] of Object.entries(forcedOptions)) {
      options[k] = k === "copies" ? Number(v) || 1 : v;
    }

    if (!options.copies) options.copies = 1;

    return {
      deliveryPromise: 0,
      designs: 1,
      options,
    };
  };

  const requestPriceWithFallback = async () => {
    const forcedOptions: Record<string, string | number> = {};
    const injected = new Set<string>();

    while (true) {
      const payload = buildPricePayload(forcedOptions);
      try {
        console.log("[price] Requesting price for", sku, "with", Object.keys(payload.options || {}).length, "options");
        return await getPrice(sku!, payload);
      } catch (err: any) {
        const errText = err?.message || "";
        const missingProp = parseMissingRequiredProperty(errText);

        // Auto-fill missing required props only when API explicitly asks for one.
        if (!missingProp || injected.has(missingProp)) {
          throw err;
        }

        const prop = allPricingProps.find((p) => p.slug === missingProp);
        const fallbackOpt = prop?.options?.find((o) => o.slug != null);
        if (!fallbackOpt) {
          throw err;
        }

        forcedOptions[missingProp] = missingProp === "copies"
          ? Number(fallbackOpt.slug) || 1
          : String(fallbackOpt.slug);
        injected.add(missingProp);
      }
    }
  };

  const fetchPrice = async () => {
    if (!sku) return;
    setPriceLoading(true);
    setPriceError(null);

    try {
      const result = await requestPriceWithFallback();

      // Print.com may return an error object inside a 200 response
      if (result?.errorMessage) {
        console.warn("[price] Print.com error:", result.errorMessage);
        setPriceResult(null);
        setPriceError(`Erreur API : ${result.errorMessage}`);
      } else {
        console.log("[price] Got price:", result?.prices?.salesPrice ?? result?.price ?? result?.totalPrice);
        setPriceResult(result);
      }
    } catch (err: any) {
      console.error("[price] Request failed:", err?.message || err);
      setPriceResult(null);
      const errText = err?.message || "";
      const match = errText.match(/\[(\d+)\]/);
      const status = match ? parseInt(match[1]) : 0;

      if (status === 400) {
        if (errText.includes("exclude group") || errText.includes("excluded configuration")) {
          setPriceError("Combinaison d'options non valide. Essayez un autre format ou mode de pliage.");
        } else if (errText.includes("does not match any range")) {
          setPriceError("La quantité sélectionnée n'est pas disponible pour ce produit.");
        } else if (errText.includes("missing required property") || errText.includes("propriété requise manquante")) {
          setPriceError("Configuration incomplète — sélectionnez les options principales.");
        } else {
          setPriceError("Configuration invalide — veuillez modifier vos options.");
        }
      } else if (status === 500) {
        setPriceError("Le service tarifaire est temporairement indisponible. Réessayez.");
      } else {
        setPriceError("Impossible de calculer le prix pour le moment.");
      }
    } finally {
      setPriceLoading(false);
    }
  };

  // Auto-calculate price when options change
  useEffect(() => {
    if (!sku || !product || configurableProps.length === 0) return;
    const allSet = configurableProps
      .filter((p) => p.required)
      .every((p) => selectedOptions[p.slug] && selectedOptions[p.slug] !== "");
    if (!allSet) {
      setPriceError(null);
      return;
    }

    const timer = setTimeout(fetchPrice, 500);
    return () => clearTimeout(timer);
  }, [sku, selectedOptions, product]);

  const productName = product?.titleSingle || sku || "";

  const handleAddToCart = () => {
    if (!product || !sku) return;
    addItem({
      sku,
      productName,
      options: selectedOptions,
      quantity: 1,
      copies: Number(selectedOptions.copies) || 1,
      unitPrice: priceResult ? getResalePrice(priceResult) + (includeDesignFee ? DESIGN_FEE_BASE : 0) : null,
      currency: priceResult?.prices?.currency || priceResult?.currency || "EUR",
      fileUrl: null,
      originalFileName: null,
    });
    toast.success("Produit ajouté au panier !");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-20 text-center">
        <p className="text-destructive">Erreur : {error || "Produit introuvable"}</p>
      </div>
    );
  }

  const imageUrl = product.imageUrl || categoryImageUrl || product.thumbnailUrl || fallbackProductImage;

  // Generate a description from product properties
  const descriptionParts: string[] = [];
  for (const prop of product.properties || []) {
    const validOpts = prop.options?.filter((o) => o.slug != null) || [];
    if (validOpts.length > 0 && prop.slug !== "copies") {
      const label = translatePropertyTitle(prop.slug, prop.title);
      const count = validOpts.length;
      descriptionParts.push(`${count} ${label.toLowerCase()}`);
    }
  }

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/products" className="hover:text-primary transition-colors">Catalogue</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{product.titlePlural || productName}</span>
      </nav>

      {/* Header with image and title */}
      <div className="mb-8 flex flex-col sm:flex-row gap-6 items-start">
        <div
          className="w-full sm:w-64 aspect-square overflow-hidden rounded-xl bg-muted shrink-0 cursor-pointer relative group"
          onClick={() => imageUrl && setImageZoom(true)}
        >
          {imageUrl ? (
            <>
              <img src={imageUrl} alt={productName} className="h-full w-full object-contain p-2" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <Package className="h-12 w-12 text-muted-foreground/20" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {product.titlePlural || productName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Configurez votre {(productName).toLowerCase()} en sélectionnant les options ci-dessous.
            {descriptionParts.length > 0 && (
              <> Disponible avec {descriptionParts.slice(0, 4).join(", ")}.</>
            )}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Livraison rapide partout en France. Devis gratuit, 
            <Link to="/#devis" className="text-primary hover:underline ml-1">contactez-nous</Link>.
          </p>
        </div>
      </div>

      {/* Main layout: options + sticky price sidebar */}
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Left: Options — full-width visual types, 2-col for others */}
        <div className="space-y-6">
          {configurableProps.map((prop) => {
            const isWide = ["foldingtype", "foldingmethod", "size", "format"].includes(prop.slug);
            return (
              <div key={prop.slug} className={cn(isWide ? "col-span-full" : "")}>
                <OptionSelector
                  title={prop.title}
                  slug={prop.slug}
                  options={prop.options}
                  selectedValue={selectedOptions[prop.slug] || ""}
                  onSelect={(val) =>
                    setSelectedOptions((prev) => ({ ...prev, [prop.slug]: val }))
                  }
                  required={prop.required}
                  locked={prop.locked}
                  initialVisibleCount={prop.slug === "copies" ? 10 : 6}
                />
              </div>
            );
          })}
        </div>

        {/* Right: Price summary sidebar */}
        <div className="hidden lg:block">
          <PriceSummary
            priceResult={priceResult}
            priceLoading={priceLoading}
            priceError={priceError}
            onAddToCart={handleAddToCart}
            onRetryPrice={fetchPrice}
            disabled={!priceResult}
            selectedOptions={selectedOptions}
            configurableProps={configurableProps}
            includeDesignFee={includeDesignFee}
            onToggleDesignFee={setIncludeDesignFee}
          />
        </div>
      </div>

      {/* Mobile price bar (sticky bottom) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            {priceLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Calcul…</span>
              </div>
            ) : priceError ? (
              <p className="text-sm text-destructive">Erreur prix</p>
            ) : priceResult ? (
              <p className="text-xl font-bold text-foreground font-display">
                {(getResalePrice(priceResult) + (includeDesignFee ? DESIGN_FEE_BASE : 0)).toFixed(2)} € HT
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Configurez les options</p>
            )}
          </div>
          <Button onClick={handleAddToCart} disabled={!priceResult} size="lg">
            Ajouter au panier
          </Button>
        </div>
      </div>

      {/* Accessories */}
      {accessories.length > 0 && (
        <div className="mt-10">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Accessoires</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accessories.map((acc: any) => (
              <div key={acc.sku} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <p className="text-sm font-medium text-card-foreground">{acc.titleSingle || acc.name || acc.sku}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    addItem({
                      sku: acc.sku,
                      productName: acc.titleSingle || acc.name || acc.sku,
                      options: {},
                      quantity: 1,
                      copies: 1,
                      unitPrice: acc.price || null,
                      currency: "EUR",
                      fileUrl: null,
                      originalFileName: null,
                    });
                    toast.success("Accessoire ajouté !");
                  }}
                >
                  Ajouter
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom spacing for mobile sticky bar */}
      <div className="h-20 lg:hidden" />

      {/* Image zoom modal */}
      {imageZoom && imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setImageZoom(false)}
        >
          <button
            onClick={() => setImageZoom(false)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={imageUrl}
            alt={productName}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ChevronRight, CheckCircle } from "lucide-react";
import { getProductSEOData } from "@/lib/product-seo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getProduct, getPrice, getShippingPossibilities } from "@/lib/printcom";
import { supabase } from "@/integrations/supabase/client";
import { getResalePrice, DESIGN_FEE_BASE } from "@/lib/pricing";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import OptionSelector from "@/components/product/OptionSelector";
import PriceSummary from "@/components/product/PriceSummary";
import ProductGallery from "@/components/product/ProductGallery";
import ProductSEOContent from "@/components/product/ProductSEOContent";
import { useSEO } from "@/hooks/useSEO";

interface ProductOption {
  slug: string;
  name: string;
  nullable?: boolean;
  eco?: boolean;
  description?: string;
}

interface ConfigurableProperty {
  slug: string;
  title: string;
  required: boolean;
  locked?: boolean;
  options: ProductOption[];
  group?: string;
  optionsInSummary?: number[];
  rangeSets?: Array<{ options: Array<{ min: number; max: number; steps: number }>; printingmethod?: string; summary?: number[] }>;
  type?: string;
  copiesInSummary?: Record<string, number[]>;
  copyLimit?: Record<string, number>;
}

type ExcludeGroup = Array<{ property: string; options: string[] }>;

interface PrintComProduct {
  sku: string;
  name?: string;
  titleSingle?: string;
  titlePlural?: string;
  description?: string;
  customsDescription?: string;
  images?: string[];
  thumbnailUrl?: string;
  properties?: ConfigurableProperty[];
  configurableProperties?: ConfigurableProperty[];
  propertyGroups?: Array<{ slug: string; columnWidth?: Record<string, string>; properties: string[] }>;
  excludes?: ExcludeGroup[];
}

interface ConfigurableProp {
  slug: string;
  title: string;
  required: boolean;
  locked: boolean;
  isQuantity: boolean;
  isBoolean: boolean;
  inputType: string;
  description?: string;
  alert?: string;
  info?: string;
  options: { slug: string; name: string }[];
}

/**
 * Check if a given combination of selected options violates any exclude group.
 * An exclude group is violated when ALL its constraints are matched simultaneously.
 */
function isExcludedCombination(
  selected: Record<string, string>,
  excludes: ExcludeGroup[] | undefined,
): boolean {
  if (!excludes?.length) return false;
  return excludes.some((group) =>
    group.every((constraint) => {
      const val = selected[constraint.property];
      return val !== undefined && constraint.options.includes(val);
    })
  );
}

/**
 * For a given property+optionSlug, check if selecting it would create an excluded combo.
 */
function wouldBeExcluded(
  propSlug: string,
  optionSlug: string,
  currentSelected: Record<string, string>,
  excludes: ExcludeGroup[] | undefined,
): boolean {
  const hypothetical = { ...currentSelected, [propSlug]: optionSlug };
  return isExcludedCombination(hypothetical, excludes);
}

/**
 * Set defaults that avoid excluded combinations.
 * Try each option; if the first creates an exclusion, try others.
 */
function buildValidDefaults(
  allProps: ConfigurableProperty[],
  excludes: ExcludeGroup[] | undefined,
): Record<string, string> {
  const defaults: Record<string, string> = {};

  // First pass: set all defaults naively
  for (const prop of allProps) {
    if (prop.slug === "copies") continue;
    if (!prop.options?.length) continue;
    const nonNullable = prop.options.filter((o) => !o.nullable);
    if (nonNullable.length === 0) continue;
    if (prop.locked || prop.required) {
      defaults[prop.slug] = String(nonNullable[0].slug);
    }
  }

  // Second pass: fix any excluded combinations
  let maxIterations = 10;
  while (maxIterations-- > 0 && isExcludedCombination(defaults, excludes)) {
    let fixed = false;
    for (const prop of allProps) {
      if (prop.slug === "copies" || !prop.options?.length) continue;
      if (!defaults[prop.slug]) continue;

      const nonNullable = prop.options.filter((o) => !o.nullable);
      for (const opt of nonNullable) {
        const test = { ...defaults, [prop.slug]: String(opt.slug) };
        if (!isExcludedCombination(test, excludes)) {
          defaults[prop.slug] = String(opt.slug);
          fixed = true;
          break;
        }
      }
      if (fixed) break;
    }
    if (!fixed) break; // Can't resolve, give up
  }

  return defaults;
}

export default function ProductDetail() {
  const { sku } = useParams<{ sku: string }>();
  const { addItem } = useCart();

  const [product, setProduct] = useState<PrintComProduct | null>(null);
  const [categoryImageUrl, setCategoryImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeDesignFee, setIncludeDesignFee] = useState(false);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState("");
  const [quantityOptions, setQuantityOptions] = useState<{ slug: string; name: string }[]>([]);

  const [priceResult, setPriceResult] = useState<any>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);

  const [productImages, setProductImages] = useState<string[]>([]);

  const productName = product?.titleSingle || product?.name || sku || "Produit";
  useSEO({
    title: `${productName} – Impression personnalisée`,
    description: product?.description
      ? product.description.slice(0, 155)
      : `Commandez ${productName} en ligne chez J2L Print. Impression professionnelle, devis gratuit et livraison rapide en France.`,
    ogType: "product",
  });
  useEffect(() => {
    if (!sku) return;

    setLoading(true);
    setError(null);
    setProduct(null);
    setSelectedOptions({});
    setQuantity("");
    setPriceResult(null);
    setPriceError(null);
    setProductImages([]);

    getProduct(sku)
      .then((data: PrintComProduct) => {
        setProduct(data);
        const allProps = data.properties || data.configurableProperties || [];
        const defaults = buildValidDefaults(allProps, data.excludes);
        setSelectedOptions(defaults);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    supabase
      .from("product_images")
      .select("image_url")
      .eq("sku", sku)
      .order("sort_order", { ascending: true })
      .then(({ data: imgs }) => {
        if (imgs && imgs.length > 0) {
          setProductImages(imgs.map((i) => i.image_url));
        }
      });

    supabase
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
        if (category?.image_url) { setCategoryImageUrl(category.image_url); return; }
        if (category?.parent_id) {
          const { data: parent } = await supabase
            .from("product_categories")
            .select("image_url")
            .eq("id", category.parent_id)
            .maybeSingle();
          if (parent?.image_url) setCategoryImageUrl(parent.image_url);
        }
      });
  }, [sku]);

  // Handle option change with exclude validation
  const handleOptionChange = useCallback((propSlug: string, value: string) => {
    setSelectedOptions((prev) => {
      const next = { ...prev, [propSlug]: value };

      // If this creates an excluded combination, try to fix other conflicting props
      if (product?.excludes && isExcludedCombination(next, product.excludes)) {
        const allProps = product.properties || product.configurableProperties || [];
        for (const group of product.excludes) {
          // Check if this group is now violated
          const allMatch = group.every((c) => {
            const v = next[c.property];
            return v !== undefined && c.options.includes(v);
          });
          if (!allMatch) continue;

          // Find the other constraint (not the one we just changed) and switch it
          for (const constraint of group) {
            if (constraint.property === propSlug) continue;
            const prop = allProps.find((p) => p.slug === constraint.property);
            if (!prop) continue;
            const nonNullable = prop.options.filter((o) => !o.nullable);
            const alternative = nonNullable.find((o) => !constraint.options.includes(String(o.slug)));
            if (alternative) {
              next[constraint.property] = String(alternative.slug);
              break;
            }
          }
        }
      }

      return next;
    });
  }, [product]);

  // Fetch shipping estimate
  const fetchShipping = useCallback(async (copies: number) => {
    if (!sku) return;
    setShippingLoading(true);
    try {
      const body = {
        items: [{ sku, copies }],
        destination: { country: "FR" },
      };
      const data = await getShippingPossibilities(body);
      const options = Array.isArray(data) ? data : data?.shippingOptions || data?.options || [];
      setShippingOptions(options);
    } catch {
      setShippingOptions([]);
    } finally {
      setShippingLoading(false);
    }
  }, [sku]);

  // Fetch price
  const fetchPrice = useCallback(async () => {
    if (!sku || !product) return;

    // Don't fetch if current combination (including copies) is excluded
    const checkSelection = { ...selectedOptions, copies: String(quantity) };
    if (isExcludedCombination(checkSelection, product.excludes)) {
      setPriceResult(null);
      setPriceError(
        "Cette combinaison (options + quantité) n'est pas disponible. Modifiez la quantité ou une option."
      );
      return;
    }

    setPriceLoading(true);
    setPriceError(null);

    try {
      const copies = parseInt(quantity, 10);
      if (!Number.isFinite(copies) || copies <= 0) {
        setPriceResult(null);
        setPriceError("Sélectionnez une quantité valide.");
        return;
      }

      const cleanOptions: Record<string, any> = {};
      for (const [key, value] of Object.entries(selectedOptions)) {
        if (value !== undefined && value !== null && value !== "") {
          cleanOptions[key] = value;
        }
      }

      const body: Record<string, any> = {
        ...cleanOptions,
        copies,
      };

      const data = await getPrice(sku, body);

      if (data.error || data.message) {
        setPriceError(data.error || data.message);
        setPriceResult(null);
      } else {
        setPriceResult(data);
        // Fetch shipping estimate for France
        fetchShipping(copies);
      }
    } catch (err: any) {
      console.error("[price] error:", err);
      setPriceResult(null);
      // Show a more specific error from the API if available
      const msg = err?.message || "";
      if (msg.includes("validate")) {
        setPriceError("Configuration invalide. Vérifiez vos options.");
      } else {
        setPriceError("Impossible de calculer le prix pour le moment.");
      }
    } finally {
      setPriceLoading(false);
    }
  }, [sku, product, selectedOptions, quantity]);

  // Build quantity options reactively based on selected printingmethod
  useEffect(() => {
    if (!product) return;
    const allProps = product.properties || product.configurableProperties || [];
    const copiesProp = allProps.find((p) => p.slug === "copies");
    if (!copiesProp) return;

    const selectedMethod = selectedOptions["printingmethod"] || "";
    let qtyOpts: { slug: string; name: string }[] = [];

    if (copiesProp.rangeSets?.length) {
      const matchingSet = copiesProp.rangeSets.find((rs) => rs.printingmethod === selectedMethod)
        || copiesProp.rangeSets[0];
      if (matchingSet.summary?.length) {
        qtyOpts = matchingSet.summary.map((n: number) => ({
          slug: String(n),
          name: String(n),
        }));
      } else if (matchingSet.options?.length) {
        const r = matchingSet.options[0];
        const step = r.steps || 1;
        const max = Math.min(r.max || 10, 20);
        for (let i = r.min || 1; i <= max; i += step) {
          qtyOpts.push({ slug: String(i), name: String(i) });
        }
      }
    } else if (copiesProp.optionsInSummary?.length) {
      qtyOpts = copiesProp.optionsInSummary.map((n: number) => ({
        slug: String(n),
        name: String(n),
      }));
    } else if (copiesProp.options?.length) {
      qtyOpts = copiesProp.options
        .filter((o) => o.slug != null)
        .map((o) => ({ slug: String(o.slug), name: o.name || String(o.slug) }));
    }

    setQuantityOptions(qtyOpts);
    if (qtyOpts.length > 0 && !qtyOpts.some((o) => o.slug === quantity)) {
      setQuantity(qtyOpts[0].slug);
    }
  }, [product, selectedOptions, quantity]);

  useEffect(() => {
    if (!sku || !product) return;
    const timer = setTimeout(fetchPrice, 800);
    return () => clearTimeout(timer);
  }, [fetchPrice]);

  // Build configurable props — filter out excluded options per property
  const configurableProps: ConfigurableProp[] = useMemo(() => {
    const allProps = product?.properties || product?.configurableProperties || [];
    if (allProps.length === 0) return [];

    const hiddenSlugs = new Set<string>();
    for (const group of product?.propertyGroups || []) {
      if (group.columnWidth?.reseller === "hidden") {
        group.properties.forEach((s) => hiddenSlugs.add(s));
      }
    }

    return allProps
      .filter((prop) => !hiddenSlugs.has(prop.slug))
      .filter((prop) => prop.slug !== "summary_image")
      .filter((prop) => {
        if (prop.slug === "copies") return true;
        if (!prop.options?.length) return false;
        const nonNullable = prop.options.filter((o) => !o.nullable);
        return nonNullable.length > 0;
      })
      .filter((prop) => !prop.locked || prop.options.length > 1)
      .map((prop) => {
        const isBooleanToggle =
          prop.options.length === 2 &&
          prop.options.some((o) => ["non", "no", "sans"].includes(o.name.toLowerCase())) &&
          prop.options.some((o) => ["oui", "yes", "avec"].includes(o.name.toLowerCase()));

        // Filter out options that would create excluded combinations
        const filteredOptions = prop.options
          .filter((o) => !o.nullable)
          .filter((o) => !wouldBeExcluded(prop.slug, String(o.slug), selectedOptions, product?.excludes));

        return {
          slug: prop.slug,
          title: prop.title,
          required: prop.required,
          locked: prop.locked || false,
          isQuantity: prop.slug === "copies" || prop.slug === "quantity",
          isBoolean: isBooleanToggle,
          inputType: filteredOptions.length > 0 ? "select" : "text",
          options: filteredOptions.map((o) => ({ slug: String(o.slug), name: o.name })),
        };
      })
      .filter((p) => p.options.length > 0);
  }, [product, selectedOptions]);

  const mainProps = configurableProps.filter((p) => !p.isBoolean && !p.isQuantity);
  const booleanProps = configurableProps.filter((p) => p.isBoolean);

  const handleAddToCart = () => {
    if (!sku || !product) return;
    const copies = parseInt(quantity) || 1;

    // Build human-readable options for display in cart
    const readableOptions: Record<string, string> = {};
    for (const [key, value] of Object.entries(selectedOptions)) {
      const prop = configurableProps.find((p) => p.slug === key);
      if (prop) {
        const opt = prop.options.find((o) => o.slug === value);
        readableOptions[prop.title] = opt?.name || value;
      } else {
        readableOptions[key] = String(value);
      }
    }
    readableOptions["Exemplaires"] = String(copies);

    addItem({
      sku,
      productName: product.titleSingle || product.name || `Produit ${sku}`,
      options: readableOptions,
      quantity: 1,
      copies,
      unitPrice: priceResult ? getResalePrice(priceResult) + (includeDesignFee ? DESIGN_FEE_BASE : 0) : null,
      currency: "EUR",
      fileUrl: null,
      originalFileName: null,
    });
    toast.success("Produit ajouté au panier !");
  };

  const images = productImages.length > 0 ? productImages : (product?.images || []);
  const thumbnailUrl = product?.thumbnailUrl || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    if (typeof document !== "undefined") {
      let robots = document.querySelector('meta[name="robots"]');
      if (!robots) {
        robots = document.createElement("meta");
        robots.setAttribute("name", "robots");
        document.head.appendChild(robots);
      }
      robots.setAttribute("content", "noindex, follow");
    }
    return (
      <div className="container py-20 text-center">
        <p className="text-destructive">Erreur : {error || "Produit introuvable"}</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/products" className="hover:text-primary transition-colors">Catalogue</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{product.titleSingle || product.name || sku}</span>
      </nav>

      <div className="mb-8 flex flex-col sm:flex-row gap-6 items-start">
        <ProductGallery
          images={images}
          productName={product.titleSingle || product.name || sku}
          fallbackImage={categoryImageUrl || thumbnailUrl}
        />
        <div className="flex-1 space-y-4">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {product.titleSingle || product.name || sku}
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {getProductSEOData(productName, sku).intro}
          </p>

          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          )}

          <h2 className="font-display text-lg font-semibold text-foreground pt-2">
            À quoi sert {/^[aeiouyàâéèêëïîôùûüÿæœ]/i.test(productName) ? "un " : "un "}{productName.toLowerCase()} ?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {getProductSEOData(productName, sku).useCases}
          </p>

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-primary" /> Livraison 3-5 jours
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-primary" /> Vérification fichiers
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-primary" /> Devis sous 24h
            </span>
          </div>
        </div>
      </div>

      {/* Quantity */}
      {quantityOptions.length > 0 ? (
        <div className="mb-6">
          <OptionSelector
            title="Quantité (exemplaires)"
            slug="copies"
            options={quantityOptions}
            selectedValue={quantity}
            onSelect={setQuantity}
            required
            inputType="select"
          />
        </div>
      ) : (
        <div className="mb-6">
          <OptionSelector
            title="Quantité (exemplaires)"
            slug="copies"
            options={[]}
            selectedValue={quantity}
            onSelect={setQuantity}
            required
            inputType="float"
          />
        </div>
      )}

      {/* Main layout */}
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {mainProps.map((prop) => (
            <OptionSelector
              key={prop.slug}
              title={prop.title}
              slug={prop.slug}
              options={prop.options}
              selectedValue={selectedOptions[prop.slug] || ""}
              onSelect={(val) => handleOptionChange(prop.slug, val)}
              required={prop.required}
              locked={prop.locked}
              inputType={prop.inputType}
            />
          ))}

          {booleanProps.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Options</h3>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {booleanProps.map((prop) => (
                  <OptionSelector
                    key={prop.slug}
                    title={prop.title}
                    slug={prop.slug}
                    options={prop.options}
                    selectedValue={selectedOptions[prop.slug] || ""}
                    onSelect={(val) => handleOptionChange(prop.slug, val)}
                    required={prop.required}
                    locked={prop.locked}
                    inputType={prop.inputType}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

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
            shippingOptions={shippingOptions}
            shippingLoading={shippingLoading}
          />
        </div>
      </div>

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

      <div className="h-20 lg:hidden" />

      <ProductSEOContent
        productName={product.titleSingle || product.name || sku || "Produit"}
        sku={sku}
        description={product.description}
        options={mainProps.map((p) => ({
          title: p.title,
          values: p.options.map((o) => o.name),
        }))}
      />
    </div>
  );
}
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getProduct, getPrice } from "@/lib/printcom";
import { supabase } from "@/integrations/supabase/client";
import { getResalePrice, DESIGN_FEE_BASE } from "@/lib/pricing";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import OptionSelector from "@/components/product/OptionSelector";
import PriceSummary from "@/components/product/PriceSummary";
import ProductGallery from "@/components/product/ProductGallery";

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
}

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
  excludes?: Array<Array<{ property: string; options: string[] }>>;
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

  const [priceResult, setPriceResult] = useState<any>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Load product
  const [productImages, setProductImages] = useState<string[]>([]);

  useEffect(() => {
    if (!sku) return;

    setLoading(true);
    setError(null);
    setProduct(null);
    setSelectedOptions({});
    setQuantity("");
    setPriceResult(null);
    setPriceError(null);

    getProduct(sku)
      .then((data: PrintComProduct) => {
        setProduct(data);

        // Set defaults from Print.com properties, including hidden required ones
        const defaults: Record<string, string> = {};
        const allProps = data.properties || data.configurableProperties || [];
        const copiesProp = allProps.find((prop) => prop.slug === "copies");

        for (const prop of allProps) {
          if (!prop.options?.length) continue;
          const firstNonNullable = prop.options.find((o) => !o.nullable) || prop.options[0];
          if (prop.slug === "copies") {
            continue;
          }
          if (prop.locked || prop.required) {
            defaults[prop.slug] = String(firstNonNullable.slug);
          }
        }

        setSelectedOptions(defaults);

        if (copiesProp?.options?.length) {
          const firstCopy = copiesProp.options.find((o) => o.slug != null) || copiesProp.options[0];
          setQuantity(String(firstCopy.slug));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    // Fetch category image fallback
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

  // Fetch price
  const fetchPrice = useCallback(async () => {
    if (!sku || !product) return;
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
      }
    } catch (err: any) {
      console.error("[price] error:", err);
      setPriceResult(null);
      setPriceError("Impossible de calculer le prix pour le moment.");
    } finally {
      setPriceLoading(false);
    }
  }, [sku, product, selectedOptions, quantity]);

  useEffect(() => {
    if (!sku || !product) return;
    const timer = setTimeout(fetchPrice, 800);
    return () => clearTimeout(timer);
  }, [fetchPrice]);

  // Build configurable props
  const configurableProps: ConfigurableProp[] = useMemo(() => {
    const allProps = product?.properties || product?.configurableProperties || [];
    if (allProps.length === 0) return [];

    // Determine hidden property slugs from propertyGroups
    const hiddenSlugs = new Set<string>();
    for (const group of product?.propertyGroups || []) {
      if (group.columnWidth?.reseller === "hidden") {
        group.properties.forEach((s) => hiddenSlugs.add(s));
      }
    }

    return allProps
      .filter((prop) => !hiddenSlugs.has(prop.slug))
      .filter((prop) => !prop.locked || prop.options.length > 1)
      .map((prop) => {
        const isBooleanToggle =
          prop.options.length === 2 &&
          prop.options.some((o) => ["non", "no", "sans"].includes(o.name.toLowerCase())) &&
          prop.options.some((o) => ["oui", "yes", "avec"].includes(o.name.toLowerCase()));

        return {
          slug: prop.slug,
          title: prop.title,
          required: prop.required,
          locked: prop.locked || false,
          isQuantity: prop.slug === "copies" || prop.slug === "quantity",
          isBoolean: isBooleanToggle,
          inputType: prop.options.length > 0 ? "select" : "text",
          options: prop.options.map((o) => ({ slug: String(o.slug), name: o.name })),
        };
      })
      .filter((p) => p.options.length > 0);
  }, [product]);

  const mainProps = configurableProps.filter((p) => !p.isBoolean && !p.isQuantity);
  const booleanProps = configurableProps.filter((p) => p.isBoolean);

  const handleAddToCart = () => {
    if (!sku || !product) return;
    const copies = parseInt(quantity) || 1;

    addItem({
      sku,
      productName: product.titleSingle || product.name || `Produit ${sku}`,
      options: { ...selectedOptions, copies: String(copies) },
      quantity: 1,
      copies,
      unitPrice: priceResult ? getResalePrice(priceResult) + (includeDesignFee ? DESIGN_FEE_BASE : 0) : null,
      currency: "EUR",
      fileUrl: null,
      originalFileName: null,
    });
    toast.success("Produit ajouté au panier !");
  };

  // Images from Print.com
  const images = product?.images || [];
  const thumbnailUrl = product?.thumbnailUrl || null;

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

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/products" className="hover:text-primary transition-colors">Catalogue</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{product.titleSingle || product.name || sku}</span>
      </nav>

      {/* Header: Image + Info */}
      <div className="mb-8 flex flex-col sm:flex-row gap-6 items-start">
        <ProductGallery
          images={images}
          productName={product.titleSingle || product.name || sku}
          fallbackImage={categoryImageUrl || thumbnailUrl}
        />
        <div className="flex-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {product.titleSingle || product.name || sku}
          </h1>
          {product.description && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Livraison rapide partout en France. Devis gratuit,
            <Link to="/#devis" className="text-primary hover:underline ml-1">contactez-nous</Link>.
          </p>
        </div>
      </div>

      {/* Quantity */}
      <div className="mb-6">
        <OptionSelector
          title="Quantité (exemplaires)"
          slug="copies"
          options={configurableProps.find((prop) => prop.slug === "copies")?.options || []}
          selectedValue={quantity}
          onSelect={setQuantity}
          required
          inputType="select"
        />
      </div>

      {/* Main layout */}
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {/* Main options */}
          {mainProps.map((prop) => (
            <OptionSelector
              key={prop.slug}
              title={prop.title}
              slug={prop.slug}
              options={prop.options}
              selectedValue={selectedOptions[prop.slug] || ""}
              onSelect={(val) => setSelectedOptions((prev) => ({ ...prev, [prop.slug]: val }))}
              required={prop.required}
              locked={prop.locked}
              inputType={prop.inputType}
            />
          ))}

          {/* Boolean toggles in "OPTIONS" section */}
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
                    onSelect={(val) => setSelectedOptions((prev) => ({ ...prev, [prop.slug]: val }))}
                    required={prop.required}
                    locked={prop.locked}
                    inputType={prop.inputType}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Price sidebar */}
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

      {/* Mobile price bar */}
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
    </div>
  );
}

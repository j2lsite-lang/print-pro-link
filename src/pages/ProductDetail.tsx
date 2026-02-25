import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProduct, getPrice, getAccessories } from "@/lib/printcom";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import OptionSelector from "@/components/product/OptionSelector";
import PriceSummary from "@/components/product/PriceSummary";

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

export default function ProductDetail() {
  const { sku } = useParams<{ sku: string }>();
  const { addItem } = useCart();

  const [product, setProduct] = useState<PrintComProduct | null>(null);
  const [accessories, setAccessories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryImageUrl, setCategoryImageUrl] = useState<string | null>(null);

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
          // Only pre-select REQUIRED options + copies/printtype/size/material to avoid
          // incompatible default combinations (e.g. material + finish exclusion groups)
          const ALWAYS_PRESELECT = new Set(["copies", "size", "printtype", "material", "printingmethod"]);
          for (const prop of prod.properties) {
            if (prop.slug === "summary_image" || prop.slug === "sample") continue;
            if (!prop.required && !ALWAYS_PRESELECT.has(prop.slug)) continue;
            const firstNonNull = prop.options?.find((o) => !o.nullable && o.slug != null);
            if (firstNonNull) {
              defaults[prop.slug] = String(firstNonNull.slug);
            }
          }
          setSelectedOptions(defaults);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    supabase
      .from("product_images")
      .select("image_url, thumbnail_url")
      .eq("sku", sku)
      .maybeSingle()
      .then(({ data: imgData }) => {
        if (imgData?.image_url) {
          setCategoryImageUrl(imgData.thumbnail_url || imgData.image_url);
          return;
        }
        return supabase
          .from("product_category_mappings")
          .select("category_id")
          .eq("sku", sku)
          .limit(1)
          .maybeSingle()
          .then(({ data: mapping }) => {
            if (!mapping?.category_id) return;
            return supabase
              .from("product_categories")
              .select("image_url")
              .eq("id", mapping.category_id)
              .maybeSingle();
          })
          .then((res: any) => {
            if (res?.data?.image_url) setCategoryImageUrl(res.data.image_url);
          });
      });
  }, [sku]);

  // Only show the 5 main configurable properties
  const MAIN_PROPERTY_SLUGS = new Set(["copies", "size", "material", "printtype", "finishing"]);
  const configurableProps = (product?.properties || []).filter(
    (p) => MAIN_PROPERTY_SLUGS.has(p.slug) && p.options?.length > 0
  );

  // Build price payload from selected options
  const buildPricePayload = () => {
    const options: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(selectedOptions)) {
      if (v == null || v === "") continue;
      if (k === "copies") {
        options[k] = Number(v) || 1;
      } else if (k === "designs") {
        // designs goes at root level, skip here
        continue;
      } else {
        options[k] = v;
      }
    }
    // Ensure copies is always present
    if (!options.copies) {
      options.copies = 1;
    }
    return {
      deliveryPromise: 0,
      designs: Number(selectedOptions.designs) || 1,
      options,
    };
  };

  const fetchPrice = () => {
    if (!sku) return;
    const payload = buildPricePayload();
    console.log("[price] Requesting price for", sku, "with", Object.keys(payload).length, "options");
    setPriceLoading(true);
    setPriceError(null);
    getPrice(sku, payload)
      .then((result) => {
        // Print.com may return an error object inside a 200 response
        if (result?.errorMessage) {
          console.warn("[price] Print.com error:", result.errorMessage);
          setPriceResult(null);
          setPriceError(`Erreur Print.com : ${result.errorMessage}`);
        } else {
          console.log("[price] Got price:", result?.price || result?.totalPrice);
          setPriceResult(result);
        }
      })
      .catch((err) => {
        console.error("[price] Request failed:", err.message);
        setPriceResult(null);
        // Parse the error for a user-facing message
        const errText = err.message || "";
        const match = errText.match(/\[(\d+)\]/);
        const status = match ? parseInt(match[1]) : 0;
        
        if (status === 400) {
          if (errText.includes("exclude group") || errText.includes("excluded configuration")) {
            setPriceError("Certaines options sélectionnées sont incompatibles entre elles. Essayez une autre combinaison.");
          } else if (errText.includes("does not match any range")) {
            setPriceError("La quantité sélectionnée n'est pas disponible pour ce produit. Essayez une autre valeur.");
          } else if (errText.includes("missing required property")) {
            setPriceError("Options incomplètes — veuillez configurer toutes les options requises.");
          } else {
            setPriceError("Configuration invalide — veuillez modifier vos options.");
          }
        } else if (status === 500) {
          setPriceError("Le service est temporairement indisponible. Réessayez.");
        } else {
          setPriceError("Impossible de calculer le prix. Vérifiez vos options.");
        }
      })
      .finally(() => setPriceLoading(false));
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
      unitPrice: priceResult?.prices?.salesPrice || priceResult?.price || priceResult?.totalPrice || null,
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

  const imageUrl = product.thumbnailUrl || product.imageUrl || categoryImageUrl;

  return (
    <div className="container py-8">
      {/* Header with image and title */}
      <div className="mb-8 flex flex-col sm:flex-row gap-6 items-start">
        <div className="w-full sm:w-48 aspect-[4/3] overflow-hidden rounded-xl bg-muted shrink-0">
          {imageUrl ? (
            <img src={imageUrl} alt={productName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <Package className="h-12 w-12 text-muted-foreground/20" />
            </div>
          )}
        </div>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {product.titlePlural || productName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configurez votre produit en sélectionnant les options ci-dessous
          </p>
        </div>
      </div>

      {/* Main layout: options grid + sticky price sidebar */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Left: Options in a multi-column grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          {configurableProps.map((prop) => (
            <OptionSelector
              key={prop.slug}
              title={prop.title}
              slug={prop.slug}
              options={prop.options}
              selectedValue={selectedOptions[prop.slug] || ""}
              onSelect={(val) =>
                setSelectedOptions((prev) => ({ ...prev, [prop.slug]: val }))
              }
              required={prop.required}
              locked={prop.locked}
              initialVisibleCount={prop.slug === "copies" ? 8 : 5}
            />
          ))}
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
                {(priceResult.prices?.salesPrice || priceResult.price || priceResult.totalPrice || 0).toFixed(2)} €
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
    </div>
  );
}
import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, Package, X, ZoomIn, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  getConfigurations,
  showVariables,
  saveConfiguration,
  getPrice,
} from "@/lib/realisaprint";
import { getResalePrice, DESIGN_FEE_BASE } from "@/lib/pricing";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import OptionSelector from "@/components/product/OptionSelector";
import PriceSummary from "@/components/product/PriceSummary";


interface RealisaprintVariable {
  name: string;
  type: string;
  default: string;
  values: Record<string, string> | false;
  readonly: boolean;
  quantity: boolean;
  production_time: boolean;
  area: string;
  position: string;
}

interface ConfigResult {
  stocks: Record<string, string>;
  variables: Record<string, RealisaprintVariable>;
}

export default function ProductDetail() {
  const { sku: productId } = useParams<{ sku: string }>();
  const { addItem } = useCart();
  const [imageZoom, setImageZoom] = useState(false);

  const [productName, setProductName] = useState("");
  const [config, setConfig] = useState<ConfigResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryImageUrl, setCategoryImageUrl] = useState<string | null>(null);
  const [productPictures, setProductPictures] = useState<string[]>([]);
  const [includeDesignFee, setIncludeDesignFee] = useState(false);

  const [selectedStock, setSelectedStock] = useState<string>("");
  const [selectedVars, setSelectedVars] = useState<Record<string, string>>({});
  const [visibleVars, setVisibleVars] = useState<Record<string, boolean>>({});
  const [variableValues, setVariableValues] = useState<Record<string, Record<string, string>>>({});

  const [configCode, setConfigCode] = useState<string | null>(null);
  const [priceResult, setPriceResult] = useState<any>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [configDetails, setConfigDetails] = useState<string>("");
  const [quantityVarKey, setQuantityVarKey] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    setLoading(true);
    setError(null);
    setConfig(null);
    setCategoryImageUrl(null);
    setProductPictures([]);
    setSelectedStock("");
    setSelectedVars({});
    setVisibleVars({});
    setVariableValues({});
    setConfigCode(null);
    setPriceResult(null);
    setPriceError(null);
    setConfigDetails("");
    setQuantityVarKey(null);

    getConfigurations(productId)
      .then((data: ConfigResult) => {
        setConfig(data);

        const stockIds = Object.keys(data.stocks || {});
        if (stockIds.length > 0) {
          setSelectedStock(stockIds[0]);
        }

        const defaults: Record<string, string> = {};
        let nextQuantityVarKey: string | null = null;

        for (const [key, variable] of Object.entries(data.variables || {})) {
          if (variable.default) {
            defaults[key] = variable.default;
          }
          if (variable.quantity) {
            nextQuantityVarKey = key;
          }
        }

        setQuantityVarKey(nextQuantityVarKey);
        setSelectedVars(defaults);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    supabase
      .from("product_category_mappings")
      .select("category_id")
      .eq("sku", productId)
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

    import("@/lib/realisaprint").then(({ listProducts }) => {
      listProducts()
        .then((data: any) => {
          const name = data?.products?.[productId];
          if (name) setProductName(name);
        })
        .catch(() => {});
    });
  }, [productId]);

  useEffect(() => {
    if (!productId || !selectedStock || Object.keys(selectedVars).length === 0) return;

    const timer = setTimeout(() => {
      showVariables(productId, selectedStock, selectedVars, true)
        .then((data: any) => {
          const visibility: Record<string, boolean> = {};
          const updatedValues: Record<string, Record<string, string>> = {};

          for (const [key, val] of Object.entries(data)) {
            if (key.startsWith("VARTICLE_") || key.startsWith("CALCARTICLE_")) {
              visibility[key] = val as boolean;
            }
          }
          setVisibleVars(visibility);

          if (data.variable_values) {
            for (const [key, vals] of Object.entries(data.variable_values as Record<string, Record<string, string>>)) {
              updatedValues[key] = vals;
            }
            setVariableValues(updatedValues);
          }

          const currentValues = (data.current_values || data.current_variables) as Record<string, string> | undefined;
          if (currentValues) {
            setSelectedVars((prev) => {
              const next = { ...prev };
              for (const [key, val] of Object.entries(currentValues)) {
                if (val != null && key.startsWith("VARTICLE_")) {
                  next[key] = String(val);
                }
              }
              return next;
            });
          }

          if (Array.isArray(data.pictures)) {
            const nextPictures = data.pictures.filter(
              (picture: unknown): picture is string => typeof picture === "string" && picture.length > 0,
            );
            if (nextPictures.length > 0) {
              setProductPictures(nextPictures);
            }
          }
        })
        .catch((err) => {
          console.warn("[show_variables] error:", err.message);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [productId, selectedStock, JSON.stringify(selectedVars)]);

  const fetchPrice = useCallback(async () => {
    if (!productId || !selectedStock) return;
    setPriceLoading(true);
    setPriceError(null);

    try {
      const saveResult = await saveConfiguration(productId, selectedStock, selectedVars);

      if (saveResult.error) {
        setPriceError(saveResult.error);
        setPriceLoading(false);
        return;
      }

      const code = String(saveResult.code);
      setConfigCode(code);
      setConfigDetails(saveResult.details || "");

      const quantity = quantityVarKey ? selectedVars[quantityVarKey] || "1" : "1";
      const priceData = await getPrice(code, quantity);

      if (priceData.error) {
        setPriceError(priceData.error);
        setPriceResult(null);
      } else {
        setPriceResult(priceData);
      }
    } catch (err: any) {
      console.error("[price] error:", err);
      setPriceResult(null);
      setPriceError("Impossible de calculer le prix pour le moment.");
    } finally {
      setPriceLoading(false);
    }
  }, [productId, selectedStock, selectedVars, quantityVarKey]);

  useEffect(() => {
    if (!productId || !config || !selectedStock) return;
    const timer = setTimeout(fetchPrice, 800);
    return () => clearTimeout(timer);
  }, [fetchPrice]);

  const handleAddToCart = () => {
    if (!productId) return;
    const quantity = quantityVarKey ? parseInt(selectedVars[quantityVarKey] || "1") : 1;

    addItem({
      sku: productId,
      productName: productName || `Produit ${productId}`,
      options: selectedVars,
      quantity: 1,
      copies: quantity,
      unitPrice: priceResult ? getResalePrice(priceResult) + (includeDesignFee ? DESIGN_FEE_BASE : 0) : null,
      currency: "EUR",
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

  if (error || !config) {
    return (
      <div className="container py-20 text-center">
        <p className="text-destructive">Erreur : {error || "Produit introuvable"}</p>
      </div>
    );
  }

  const imageUrl = productPictures[0] || categoryImageUrl || null;

  // Build configurable props from Realisaprint variables
  const configurableProps = Object.entries(config.variables || {})
    .filter(([key]) => {
      // Show only visible variables
      if (Object.keys(visibleVars).length > 0 && visibleVars[key] === false) return false;
      return true;
    })
    .filter(([, variable]) => {
      // Hide readonly, production_time, session type
      if (variable.readonly) return false;
      if (variable.production_time) return false;
      if (variable.type === "session") return false;
      return true;
    })
    .sort(([, a], [, b]) => parseInt(a.position) - parseInt(b.position))
    .map(([key, variable]) => {
      // Use updated values from show_variables if available
      const values = variableValues[key] || (variable.values && typeof variable.values === "object" ? variable.values : {});
      
      return {
        slug: key,
        title: variable.name,
        required: true,
        locked: variable.readonly,
        isQuantity: variable.quantity,
        inputType: variable.type as string, // "select", "float", "session", etc.
        options: Object.entries(values).map(([id, name]) => ({
          slug: id,
          name,
        })),
      };
    })
    .filter((p) => p.options.length > 0 || p.inputType === "float");

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/products" className="hover:text-primary transition-colors">Catalogue</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{productName || `Produit ${productId}`}</span>
      </nav>

      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row gap-6 items-start">
        {imageUrl ? (
          <div
            className="w-full sm:w-64 aspect-square overflow-hidden rounded-xl bg-muted shrink-0 cursor-pointer relative group"
            onClick={() => setImageZoom(true)}
          >
            <img src={imageUrl} alt={productName} className="h-full w-full object-contain p-2" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ) : (
          <div className="w-full sm:w-64 aspect-square overflow-hidden rounded-xl bg-muted shrink-0 flex items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        <div className="flex-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {productName || `Produit ${productId}`}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Configurez votre produit en sélectionnant les options ci-dessous.
          </p>
          {configDetails && (
            <p className="mt-2 text-xs text-muted-foreground whitespace-pre-line">{configDetails}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Livraison rapide partout en France. Devis gratuit,
            <Link to="/#devis" className="text-primary hover:underline ml-1">contactez-nous</Link>.
          </p>
        </div>
      </div>

      {/* Stock selector (if multiple stocks) */}
      {Object.keys(config.stocks || {}).length > 1 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase mb-3">
            Type de produit
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(config.stocks).map(([id, name]) => (
              <button
                key={id}
                onClick={() => setSelectedStock(id)}
                className={cn(
                  "rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all",
                  selectedStock === id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40"
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Options */}
        <div className="space-y-5">
          {/* Main options (non-boolean) */}
          {configurableProps
            .filter((p) => !p.isBoolean)
            .map((prop) => (
              <OptionSelector
                key={prop.slug}
                title={prop.title}
                slug={prop.slug}
                options={prop.options}
                selectedValue={selectedVars[prop.slug] || ""}
                onSelect={(val) =>
                  setSelectedVars((prev) => ({ ...prev, [prop.slug]: val }))
                }
                required={prop.required}
                locked={prop.locked}
                inputType={prop.inputType}
              />
            ))}

          {/* Boolean toggles grouped under "OPTIONS" */}
          {configurableProps.some((p) => p.isBoolean) && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Options</h3>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {configurableProps
                  .filter((p) => p.isBoolean)
                  .map((prop) => (
                    <OptionSelector
                      key={prop.slug}
                      title={prop.title}
                      slug={prop.slug}
                      options={prop.options}
                      selectedValue={selectedVars[prop.slug] || ""}
                      onSelect={(val) =>
                        setSelectedVars((prev) => ({ ...prev, [prop.slug]: val }))
                      }
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
            selectedOptions={selectedVars}
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

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, ShoppingCart, Calculator, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProduct, getPrice, getAccessories } from "@/lib/printcom";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";


interface ProductProperty {
  slug: string;
  title: string;
  required: boolean;
  locked: boolean;
  options: { slug: string | number | null; name?: string; nullable?: boolean; eco?: boolean }[];
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


  // Configurator state
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [copies, setCopies] = useState(1);

  // Price
  const [priceResult, setPriceResult] = useState<any>(null);
  const [priceLoading, setPriceLoading] = useState(false);

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
          for (const prop of prod.properties) {
            if (prop.slug === "summary_image" || prop.slug === "copies" || prop.slug === "sample") continue;
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

    // Fetch category image as fallback
    supabase
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
  }, [sku]);


  // Filter configurable properties (exclude metadata-like ones)
  const configurableProps = (product?.properties || []).filter(
    (p) => p.slug !== "summary_image" && p.slug !== "copies" && p.slug !== "sample" && p.options?.length > 0
  );

  const handleCalcPrice = async () => {
    if (!sku) return;
    setPriceLoading(true);
    try {
      const result = await getPrice(sku, {
        ...selectedOptions,
        copies,
      });
      setPriceResult(result);
    } catch (err: any) {
      toast.error("Erreur calcul prix: " + err.message);
    } finally {
      setPriceLoading(false);
    }
  };

  const productName = product?.titleSingle || sku || "";

  const handleAddToCart = () => {
    if (!product || !sku) return;
    addItem({
      sku,
      productName,
      options: selectedOptions,
      quantity,
      copies,
      unitPrice: priceResult?.price || priceResult?.totalPrice || null,
      currency: priceResult?.currency || "EUR",
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

  return (
    <div className="container py-10">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Left: image */}
        <div className="aspect-square overflow-hidden rounded-xl bg-muted">
          {product.thumbnailUrl || product.imageUrl || categoryImageUrl ? (
            <img
              src={product.thumbnailUrl || product.imageUrl || categoryImageUrl!}
              alt={productName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <Package className="h-20 w-20 text-muted-foreground/20" />
              <span className="text-sm text-muted-foreground">{productName}</span>
            </div>
          )}
        </div>


        {/* Right: configurator */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{productName}</h1>

          {/* Options configurator */}
          <div className="mt-8 space-y-5">
            {configurableProps.map((prop) => (
              <div key={prop.slug}>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {prop.title}
                  {prop.required && <span className="ml-1 text-destructive">*</span>}
                </label>
                <select
                  value={selectedOptions[prop.slug] || ""}
                  onChange={(e) =>
                    setSelectedOptions((prev) => ({ ...prev, [prop.slug]: e.target.value }))
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  {prop.options
                    .filter((o) => o.slug != null)
                    .map((o) => (
                      <option key={String(o.slug)} value={String(o.slug)}>
                        {o.name || String(o.slug)}
                        {o.eco ? " 🌿" : ""}
                      </option>
                    ))}
                </select>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Quantité</label>
                <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Exemplaires</label>
                <Input type="number" min={1} value={copies} onChange={(e) => setCopies(Number(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={handleCalcPrice} disabled={priceLoading}>
              {priceLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
              Calculer le prix
            </Button>
            <Button onClick={handleAddToCart}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Ajouter au panier
            </Button>
          </div>

          {priceResult && (
            <div className="mt-4 rounded-lg border border-border bg-muted p-4">
              <p className="text-lg font-bold text-foreground">
                {(priceResult.price || priceResult.totalPrice || 0).toFixed(2)} {priceResult.currency || "EUR"}
              </p>
              {priceResult.pricePerUnit && (
                <p className="text-sm text-muted-foreground">
                  {priceResult.pricePerUnit.toFixed(2)} / unité
                </p>
              )}
            </div>
          )}

          {/* Accessories */}
          {accessories.length > 0 && (
            <div className="mt-8">
              <h3 className="font-display text-lg font-semibold text-foreground">Accessoires</h3>
              <div className="mt-3 grid gap-3">
                {accessories.map((acc: any) => (
                  <div key={acc.sku} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{acc.titleSingle || acc.name || acc.sku}</p>
                    </div>
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
        </div>
      </div>
    </div>
  );
}

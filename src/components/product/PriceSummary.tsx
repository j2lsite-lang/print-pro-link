import { Loader2, ShoppingCart, RefreshCw, Palette, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getResalePrice, DESIGN_FEE_BASE } from "@/lib/pricing";

interface OptionItem {
  slug: string | number | null;
  name?: string;
  nullable?: boolean;
}

interface ConfigurableProp {
  slug: string;
  title: string;
  options: OptionItem[];
}

interface PriceSummaryProps {
  priceResult: any;
  priceLoading: boolean;
  priceError?: string | null;
  onAddToCart: () => void;
  onRetryPrice?: () => void;
  disabled: boolean;
  selectedOptions: Record<string, string>;
  configurableProps: ConfigurableProp[];
  includeDesignFee: boolean;
  onToggleDesignFee: (checked: boolean) => void;
  shippingOptions?: any[];
  shippingLoading?: boolean;
}

function getOptionLabel(prop: ConfigurableProp, selectedSlug: string): string {
  const match = prop.options.find((o) => String(o.slug) === selectedSlug);
  if (match?.name) return match.name;
  return selectedSlug;
}

export default function PriceSummary({
  priceResult,
  priceLoading,
  priceError,
  onAddToCart,
  onRetryPrice,
  disabled,
  selectedOptions,
  configurableProps,
  includeDesignFee,
  onToggleDesignFee,
  shippingOptions = [],
  shippingLoading = false,
}: PriceSummaryProps) {
  const summaryItems = configurableProps
    .filter((p) => selectedOptions[p.slug])
    .slice(0, 10);

  const designFee = includeDesignFee ? DESIGN_FEE_BASE : 0;

  return (
    <div className="rounded-xl border border-border bg-card/90 backdrop-blur-sm p-5 lg:p-6 space-y-5">
      <h3 className="font-display text-lg font-bold text-foreground">Récapitulatif</h3>

      {/* Options list — one line per option, label left, full value right */}
      {summaryItems.length > 0 && (
        <div className="space-y-0">
          {summaryItems.map((prop) => (
            <div
              key={prop.slug}
              className="grid grid-cols-[1fr_auto] gap-3 py-2.5 border-b border-border/50 last:border-b-0"
            >
              <span className="text-sm text-muted-foreground">{prop.title}</span>
              <span className="text-sm text-foreground font-medium text-right break-words max-w-[200px]">
                {getOptionLabel(prop, selectedOptions[prop.slug])}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Design fee toggle */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3">
        <Checkbox
          id="design-fee"
          checked={includeDesignFee}
          onCheckedChange={(checked) => onToggleDesignFee(checked === true)}
          className="mt-0.5"
        />
        <label htmlFor="design-fee" className="cursor-pointer space-y-0.5">
          <span className="flex items-center gap-1 text-sm font-medium text-foreground">
            <Palette className="h-3.5 w-3.5 text-primary" />
            Conception de maquette
          </span>
          <span className="text-xs text-muted-foreground block">
            À partir de {DESIGN_FEE_BASE} € HT (si vous ne fournissez pas de fichier)
          </span>
        </label>
      </div>

      {/* Price block */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
        {priceLoading ? (
          <div className="flex items-center justify-center gap-2 py-3 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Calcul du prix…</span>
          </div>
        ) : priceError ? (
          <div className="space-y-2 py-2">
            <p className="text-sm text-destructive">{priceError}</p>
            {onRetryPrice && (
              <Button variant="outline" size="sm" onClick={onRetryPrice} className="w-full">
                <RefreshCw className="mr-2 h-3 w-3" />
                Réessayer
              </Button>
            )}
          </div>
        ) : priceResult ? (
          <div className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impression</span>
                <span className="text-foreground font-medium">{getResalePrice(priceResult).toFixed(2)} €</span>
              </div>
              {priceResult?.deliveryDays && (
                <p className="text-xs text-muted-foreground">
                  Délai estimé : {priceResult.deliveryDays} jours ouvrés
                </p>
              )}
              {includeDesignFee && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Palette className="h-3 w-3" /> Maquette
                  </span>
                  <span className="text-foreground font-medium">{DESIGN_FEE_BASE.toFixed(2)} €</span>
                </div>
              )}

              {/* Shipping */}
              {shippingLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-xs">Calcul livraison…</span>
                </div>
              ) : shippingOptions.length > 0 ? (
                <div className="space-y-1">
                  {shippingOptions.slice(0, 3).map((opt: any, i: number) => {
                    const price = opt?.price?.totalPrice ?? opt?.price ?? opt?.totalPrice;
                    const name = opt?.name || opt?.carrier || opt?.description || `Option ${i + 1}`;
                    const days = opt?.deliveryDays || opt?.estimatedDeliveryDays || opt?.days;
                    return (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1 truncate">
                          <Truck className="h-3 w-3 flex-shrink-0" /> {name}
                          {days && <span className="text-xs">({days}j)</span>}
                        </span>
                        <span className="text-foreground font-medium">
                          {price != null ? `${Number(price).toFixed(2)} €` : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : priceResult ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Truck className="h-3 w-3" /> Frais de livraison calculés au checkout
                </p>
              ) : null}
            </div>

            {/* Total */}
            <div className="border-t border-border pt-3 space-y-1">
              <p className="text-xs text-muted-foreground">Prix estimatif HT</p>
              <p className="text-3xl lg:text-4xl font-bold text-foreground font-display">
                {(getResalePrice(priceResult) + designFee).toFixed(2)} €
              </p>
              <p className="text-xs text-muted-foreground">Hors livraison</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">
            Sélectionnez toutes les options pour voir le prix
          </p>
        )}
      </div>

      <Button
        onClick={onAddToCart}
        disabled={disabled}
        className="w-full"
        size="lg"
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        Ajouter au devis
      </Button>
    </div>
  );
}

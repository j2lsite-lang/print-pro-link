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
    .slice(0, 8);

  const designFee = includeDesignFee ? DESIGN_FEE_BASE : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 sticky top-24">
      <h3 className="font-display text-lg font-bold text-foreground">Récapitulatif</h3>

      <div className="space-y-2 text-sm">
        {summaryItems.map((prop) => (
          <div key={prop.slug} className="flex justify-between gap-4">
            <span className="text-muted-foreground truncate">{prop.title}</span>
            <span className="text-primary font-medium text-right truncate max-w-[55%]">
              {getOptionLabel(prop, selectedOptions[prop.slug])}
            </span>
          </div>
        ))}
      </div>

      {/* Design fee toggle */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-3">
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

      <div className="border-t border-border pt-4">
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
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impression</span>
                <span className="text-foreground">{getResalePrice(priceResult).toFixed(2)} €</span>
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
                  <span className="text-foreground">{DESIGN_FEE_BASE.toFixed(2)} €</span>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-2">
              <p className="text-xs text-muted-foreground">Total HT</p>
              <p className="text-3xl font-bold text-foreground font-display">
                {(getResalePrice(priceResult) + designFee).toFixed(2)} €
              </p>
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
        Demander un devis
      </Button>
    </div>
  );
}

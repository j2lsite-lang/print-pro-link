import { Loader2, ShoppingCart, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { humanizeSlug, translatePropertyTitle } from "@/lib/slug-translations";

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
}

function getOptionLabel(prop: ConfigurableProp, selectedSlug: string): string {
  const match = prop.options.find((o) => String(o.slug) === selectedSlug);
  if (match?.name) return match.name;
  // For copies/quantities, format as number
  const num = Number(selectedSlug);
  if (!isNaN(num) && prop.slug === "copies") return num.toLocaleString("fr-FR");
  return humanizeSlug(selectedSlug);
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
}: PriceSummaryProps) {
  const summaryItems = configurableProps
    .filter((p) => selectedOptions[p.slug])
    .slice(0, 8);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 sticky top-24">
      <h3 className="font-display text-lg font-bold text-foreground">Récapitulatif</h3>

      <div className="space-y-2 text-sm">
        {summaryItems.map((prop) => (
          <div key={prop.slug} className="flex justify-between gap-4">
            <span className="text-muted-foreground truncate">{translatePropertyTitle(prop.slug, prop.title)}</span>
            <span className="text-primary font-medium text-right truncate max-w-[55%]">
              {getOptionLabel(prop, selectedOptions[prop.slug])}
            </span>
          </div>
        ))}
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
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total hors TVA</p>
            <p className="text-3xl font-bold text-foreground font-display">
              {(priceResult.prices?.salesPrice ?? priceResult.price ?? priceResult.totalPrice ?? 0).toFixed(2)} €
            </p>
            {(priceResult.prices?.salesPrice ?? 0) > 0 && (priceResult.options?.copies ?? 1) > 1 && (
              <p className="text-xs text-muted-foreground">
                {((priceResult.prices.salesPrice) / priceResult.options.copies).toFixed(4)} € / unité
              </p>
            )}
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
        Ajouter au panier
      </Button>
    </div>
  );
}
import { Link } from "react-router-dom";
import { Trash2, ShoppingBag, ArrowRight, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

export default function Cart() {
  const { items, removeItem, total, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="container flex flex-col items-center justify-center py-20">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="mt-4 font-display text-2xl font-bold text-foreground">Votre panier est vide</h2>
        <p className="mt-2 text-muted-foreground">Ajoutez des produits depuis notre catalogue.</p>
        <Button asChild className="mt-6">
          <Link to="/products">Voir le catalogue</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold text-foreground">Panier</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => {
            const price = item.unitPrice ? item.unitPrice * item.quantity : null;
            // Filter out internal/technical options
            const displayOptions = Object.entries(item.options).filter(
              ([k]) => !["article_number", "copies"].includes(k)
            );

            return (
              <div key={item.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display font-semibold text-card-foreground">{item.productName}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Réf: {item.sku} · {item.copies} exemplaire{item.copies > 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {price != null ? (
                          <p className="font-display font-bold text-foreground text-lg">
                            {price.toFixed(2)} € <span className="text-xs font-normal text-muted-foreground">HT</span>
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Sur devis</p>
                        )}
                      </div>
                    </div>

                    {displayOptions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {displayOptions.slice(0, 8).map(([k, v]) => {
                          const label = typeof v === "object" && v !== null
                            ? (v as any).name || (v as any).slug || JSON.stringify(v)
                            : String(v);
                          return (
                            <span
                              key={k}
                              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                            >
                              <span className="font-medium text-foreground">{k}:</span> {label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end border-t border-border pt-3">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card h-fit sticky top-24">
          <h3 className="font-display text-lg font-semibold text-card-foreground">Résumé</h3>
          <div className="mt-4 space-y-3 text-sm">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between gap-2">
                <span className="text-muted-foreground truncate">{item.productName}</span>
                <span className="font-medium text-foreground shrink-0">
                  {item.unitPrice ? `${(item.unitPrice * item.quantity).toFixed(2)} €` : "Sur devis"}
                </span>
              </div>
            ))}
            <div className="border-t border-border pt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total HT</span>
                <span className="font-medium text-foreground">{total.toFixed(2)} €</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Truck className="h-3.5 w-3.5" /> Livraison
              </span>
              <span className="text-muted-foreground">Calculée à l'étape suivante</span>
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex justify-between text-lg font-bold font-display">
              <span>Total HT</span>
              <span>{total.toFixed(2)} €</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Hors frais de livraison</p>
          </div>
          <Button asChild className="mt-6 w-full" size="lg">
            <Link to="/checkout">
              Passer commande
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="mt-2 w-full text-destructive" onClick={clearCart}>
            Vider le panier
          </Button>
        </div>
      </div>
    </div>
  );
}

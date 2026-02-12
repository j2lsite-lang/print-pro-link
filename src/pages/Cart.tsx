import { Link } from "react-router-dom";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
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
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
                <span className="text-xs font-bold text-muted-foreground">{item.sku.slice(0, 6)}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-card-foreground">{item.productName}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  SKU: {item.sku} · Qté: {item.quantity} · Ex: {item.copies}
                </p>
                {Object.keys(item.options).length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                  </p>
                )}
              </div>
              <div className="text-right">
                {item.unitPrice && (
                  <p className="font-semibold text-foreground">{(item.unitPrice * item.quantity).toFixed(2)} €</p>
                )}
                <button onClick={() => removeItem(item.id)} className="mt-2 text-destructive hover:text-destructive/80">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card h-fit">
          <h3 className="font-display text-lg font-semibold text-card-foreground">Résumé</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sous-total</span>
              <span className="font-medium text-foreground">{total.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Livraison</span>
              <span className="text-muted-foreground">Calculé au checkout</span>
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{total.toFixed(2)} €</span>
            </div>
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

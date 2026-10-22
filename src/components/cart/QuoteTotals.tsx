import { quoteTotals, SHIPPING_ON_QUOTE } from "@/lib/shipping";
const money = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;
export function QuoteTotals({ productsHt, shippingHt, fullyPriced, country, postalCode }: { productsHt: number; shippingHt: number | null; fullyPriced: boolean; country: string; postalCode?: string }) {
  const totals = quoteTotals(productsHt, shippingHt, /^(97|98)/.test(postalCode || "") ? "overseas" : country);
  return <div className="space-y-3 text-sm">
    <div className="flex justify-between gap-3"><span className="text-muted-foreground">Sous-total produits HT</span><span>{fullyPriced ? money(productsHt) : "Sur devis"}</span></div>
    <div className="flex justify-between gap-3"><span className="text-muted-foreground">Livraison HT</span><span className="text-right">{shippingHt == null ? SHIPPING_ON_QUOTE : money(shippingHt)}</span></div>
    <div className="flex justify-between gap-3 border-t border-border pt-3 font-semibold"><span>Total estimatif HT</span><span>{fullyPriced && totals.estimatedTotalHt != null ? money(totals.estimatedTotalHt) : "À confirmer sur devis"}</span></div>
    <div className="flex justify-between gap-3"><span className="text-muted-foreground">TVA{totals.vatRate != null ? " (20 %)" : ""}</span><span>{fullyPriced && totals.vatAmount != null ? money(totals.vatAmount) : "À confirmer sur devis"}</span></div>
    <div className="flex justify-between gap-3 text-lg font-bold"><span>Total estimatif TTC</span><span>{fullyPriced && totals.estimatedTotalTtc != null ? money(totals.estimatedTotalTtc) : "Sur devis"}</span></div>
  </div>;
}
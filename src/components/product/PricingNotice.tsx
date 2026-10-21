import { PRICING_NOTICE, FLAT_SHIPPING_HT, DESIGN_FEE_BASE } from "@/lib/pricing";

export default function PricingNotice() {
  return (
    <div className="space-y-1 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Prix selon configuration</p>
      <p>{PRICING_NOTICE}</p>
      <p className="text-xs">Montants HT. Livraison : {FLAT_SHIPPING_HT.toFixed(2).replace(".", ",")} € HT par devis. Conception de maquette en option à partir de {DESIGN_FEE_BASE} € HT. TVA et montant TTC précisés sur le devis.</p>
    </div>
  );
}
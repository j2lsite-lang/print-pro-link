import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ShippingAddress, ShippingChoice } from "@/lib/shipping";
export function ShippingFields({ address, onChange, method, onMethod, choices, loading }: {
  address: ShippingAddress; onChange: (address: ShippingAddress) => void; method: string; onMethod: (method: string) => void; choices: ShippingChoice[]; loading: boolean;
}) {
  return <div className="space-y-3">
    <label className="block text-sm text-muted-foreground">Pays de livraison
      <Input aria-label="Pays de livraison" value={address.country} maxLength={2} onChange={e => onChange({ ...address, country: e.target.value.toUpperCase() })} />
    </label>
    <div className="grid grid-cols-2 gap-3">
      <Input aria-label="Code postal de livraison" placeholder="Code postal" value={address.postalCode || ""} onChange={e => onChange({ ...address, postalCode: e.target.value })} />
      <Input aria-label="Ville de livraison" placeholder="Ville" value={address.city || ""} onChange={e => onChange({ ...address, city: e.target.value })} />
    </div>
    <Input aria-label="Rue de livraison" placeholder="Rue" value={address.street || ""} onChange={e => onChange({ ...address, street: e.target.value })} />
    <Input aria-label="Numéro de livraison" placeholder="N°" value={address.houseNumber || ""} onChange={e => onChange({ ...address, houseNumber: e.target.value })} />
    {loading && <p className="text-sm text-muted-foreground">Calcul de la livraison…</p>}
    {choices.length > 0 && <Select value={method || choices[0]?.method} onValueChange={onMethod}>
      <SelectTrigger aria-label="Mode de livraison"><SelectValue placeholder="Mode de livraison" /></SelectTrigger>
      <SelectContent>{choices.map(c => <SelectItem key={c.method} value={c.method}>{c.carrier} · {c.method.replace(/_/g, " ")} · {c.cost.toFixed(2).replace(".", ",")} € HT</SelectItem>)}</SelectContent>
    </Select>}
  </div>;
}
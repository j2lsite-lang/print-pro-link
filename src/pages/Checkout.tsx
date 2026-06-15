import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Upload, CheckCircle, Truck, Package, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { getShippingPossibilities } from "@/lib/printcom";
import { toast } from "sonner";

interface ShippingOption {
  name: string;
  price: number;
  currency: string;
  deliveryDays?: number;
  carrier?: string;
}

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();

  // Unique request id generated up-front so uploads land in this request's folder.
  const requestIdRef = useRef<string>(crypto.randomUUID());
  const requestId = requestIdRef.current;

  const [address, setAddress] = useState({
    firstName: "", lastName: "", company: "", street: "", houseNumber: "",
    city: "", postalCode: "", country: "FR", phone: "", email: "", message: "",
  });

  const [fileUploads, setFileUploads] = useState<Record<string, { url: string; name: string; path: string }>>({});
  const [submitting, setSubmitting] = useState(false);

  // Shipping state
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  // Fetch shipping when address postal code & country are filled
  const fetchShipping = useCallback(async () => {
    if (!address.postalCode || !address.country || items.length === 0) return;

    setShippingLoading(true);
    setShippingError(null);
    setShippingOptions([]);
    setSelectedShipping(null);

    try {
      const allOptions = new Map<string, ShippingOption>();

      for (const item of items) {
        const opts = item.options as Record<string, unknown>;
        const itemOptions: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(opts)) {
          if (val !== undefined && val !== null && val !== "") {
            itemOptions[key] = typeof val === "object" && val !== null && "slug" in val
              ? (val as any).slug
              : val;
          }
        }
        if (!itemOptions.copies) {
          itemOptions.copies = item.copies;
        }

        try {
          const result = await getShippingPossibilities({
            address: {
              country: address.country,
              postalCode: address.postalCode,
              city: address.city || undefined,
            },
            item: {
              sku: item.sku,
              options: itemOptions,
            },
          });

          if (result?.results?.length) {
            for (const r of result.results) {
              const key = r.name || r.carrier || "standard";
              if (!allOptions.has(key)) {
                allOptions.set(key, {
                  name: r.name || r.carrier || "Livraison standard",
                  price: r.price?.salesPrice || r.price?.normalPrice || 0,
                  currency: r.price?.currency || "EUR",
                  deliveryDays: r.deliveryDays || r.deliveryTimeInDays,
                  carrier: r.carrier,
                });
              }
            }
          }
        } catch (err) {
          console.warn(`[shipping] Could not get shipping for ${item.sku}:`, err);
        }
      }

      const options = Array.from(allOptions.values()).sort((a, b) => a.price - b.price);

      if (options.length > 0) {
        setShippingOptions(options);
        setSelectedShipping(options[0]);
      } else {
        setShippingError("Les frais de livraison seront calculés dans votre devis personnalisé.");
      }
    } catch (err: any) {
      console.error("[shipping] error:", err);
      setShippingError("Les frais de livraison seront calculés dans votre devis personnalisé.");
    } finally {
      setShippingLoading(false);
    }
  }, [address.postalCode, address.country, address.city, items]);

  useEffect(() => {
    if (address.postalCode.length >= 4 && address.country) {
      const timer = setTimeout(fetchShipping, 1000);
      return () => clearTimeout(timer);
    }
  }, [fetchShipping]);

  const shippingCost = selectedShipping?.price || 0;
  const grandTotal = total + shippingCost;

  const handleFileUpload = async (itemId: string, file: File) => {
    // Upload only into this request's folder: quotes/<requestId>/...
    const path = `quotes/${requestId}/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("print-files").upload(path, file);
    if (error) { toast.error("Erreur upload: " + error.message); return; }

    setFileUploads(prev => ({ ...prev, [itemId]: { url: path, name: file.name, path } }));
    toast.success("Fichier ajouté !");
  };

  const handleSubmitQuote = async () => {
    if (!address.email || !address.firstName || !address.lastName) {
      toast.error("Veuillez remplir au minimum votre nom, prénom et email.");
      return;
    }
    setSubmitting(true);

    try {
      const fullAddress = [address.houseNumber, address.street].filter(Boolean).join(" ");

      const quoteItems = items.map(i => ({
        product_name: i.productName,
        sku: i.sku,
        quantity: i.quantity,
        copies: i.copies,
        options: i.options,
        unit_price: i.unitPrice,
        line_total: i.unitPrice != null ? i.unitPrice * i.quantity : null,
        currency: i.currency,
        file_url: fileUploads[i.id]?.url || i.fileUrl || null,
        file_name: fileUploads[i.id]?.name || i.originalFileName || null,
      }));

      const { error } = await supabase.from("quote_requests").insert({
        reference: `DEVIS-${requestId.slice(0, 8).toUpperCase()}`,
        name: `${address.firstName} ${address.lastName}`.trim(),
        company: address.company || null,
        email: address.email,
        phone: address.phone || null,
        address: fullAddress || null,
        postal_code: address.postalCode || null,
        city: address.city || null,
        message: address.message || null,
        items: JSON.parse(JSON.stringify(quoteItems)),
        estimated_total: grandTotal || null,
        shipping_cost: shippingCost || null,
        currency: "EUR",
      });

      if (error) throw error;

      clearCart();
      toast.success("Demande de devis envoyée avec succès ! Nous vous recontactons rapidement.");
      navigate("/");
    } catch (err: any) {
      toast.error("Erreur: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="font-display text-3xl font-bold text-foreground">Demande de devis</h1>
      <p className="mt-2 text-muted-foreground">
        Renseignez vos coordonnées et joignez vos fichiers. Nous vous envoyons un devis personnalisé sans aucun paiement en ligne.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-foreground">Vos coordonnées</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input placeholder="Prénom *" value={address.firstName} onChange={e => setAddress(p => ({ ...p, firstName: e.target.value }))} />
          <Input placeholder="Nom *" value={address.lastName} onChange={e => setAddress(p => ({ ...p, lastName: e.target.value }))} />
          <Input placeholder="Email *" type="email" value={address.email} onChange={e => setAddress(p => ({ ...p, email: e.target.value }))} className="sm:col-span-2" />
          <Input placeholder="Société (optionnel)" value={address.company} onChange={e => setAddress(p => ({ ...p, company: e.target.value }))} className="sm:col-span-2" />
          <Input placeholder="Rue" value={address.street} onChange={e => setAddress(p => ({ ...p, street: e.target.value }))} />
          <Input placeholder="N°" value={address.houseNumber} onChange={e => setAddress(p => ({ ...p, houseNumber: e.target.value }))} />
          <Input placeholder="Code postal *" value={address.postalCode} onChange={e => setAddress(p => ({ ...p, postalCode: e.target.value }))} />
          <Input placeholder="Ville" value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} />
          <Input placeholder="Téléphone" value={address.phone} onChange={e => setAddress(p => ({ ...p, phone: e.target.value }))} className="sm:col-span-2" />
          <textarea
            placeholder="Votre message (optionnel)"
            value={address.message}
            onChange={e => setAddress(p => ({ ...p, message: e.target.value }))}
            className="sm:col-span-2 flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-foreground">Fichiers d'impression</h2>
        <div className="mt-4 space-y-4">
          {items.map(item => (
            <div key={item.id} className="rounded-lg border border-border bg-card p-4">
              <p className="font-medium text-card-foreground">{item.productName}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <Upload className="h-4 w-4" />
                  {fileUploads[item.id] ? fileUploads[item.id].name : "Joindre un fichier"}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.tif,.tiff,.png,.ai,.eps"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleFileUpload(item.id, e.target.files[0])}
                  />
                </label>
                {fileUploads[item.id] && (
                  <span className="flex items-center gap-1 text-sm text-success">
                    <CheckCircle className="h-4 w-4" /> Fichier prêt
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shipping section */}
      <section className="mt-10">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Truck className="h-5 w-5 text-primary shrink-0" />
            <h2 className="font-display text-lg font-semibold text-foreground">Livraison (estimation)</h2>
          </div>

          {shippingLoading ? (
            <div className="flex items-center gap-2 py-3 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Calcul des frais de livraison…</span>
            </div>
          ) : shippingOptions.length > 0 ? (
            <div className="space-y-2">
              {shippingOptions.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedShipping(opt)}
                  className={`w-full flex items-center justify-between rounded-lg border p-4 text-left transition-colors ${
                    selectedShipping?.name === opt.name
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{opt.name}</p>
                      {opt.deliveryDays && (
                        <p className="text-xs text-muted-foreground">
                          {opt.deliveryDays} jour{opt.deliveryDays > 1 ? "s" : ""} ouvré{opt.deliveryDays > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {opt.price > 0 ? `${opt.price.toFixed(2)} €` : "Gratuit"}
                  </span>
                </button>
              ))}
            </div>
          ) : shippingError ? (
            <p className="text-sm text-muted-foreground">{shippingError}</p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Renseignez votre code postal pour estimer automatiquement les frais de livraison.
              </p>
              <Link to="/livraison" className="text-sm text-primary hover:underline inline-block">
                Consulter nos informations de livraison →
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="mt-10 rounded-xl border border-border bg-card p-6">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Produits HT (estimation)</span>
            <span className="text-foreground">{total.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Livraison (estimation)</span>
            <span className="text-foreground">
              {shippingLoading ? "…" : shippingCost > 0 ? `${shippingCost.toFixed(2)} €` : selectedShipping ? "Gratuit" : "À calculer"}
            </span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between">
            <span className="text-sm font-medium text-foreground">Total estimé HT</span>
            <span className="text-2xl font-bold text-foreground font-display">
              {grandTotal.toFixed(2)} €
            </span>
          </div>
        </div>
        <Button size="lg" className="w-full" onClick={handleSubmitQuote} disabled={submitting}>
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          Demander un devis
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-3">
          Demande sans engagement et sans paiement en ligne. Nous vous recontactons avec votre devis personnalisé.
        </p>
      </div>
    </div>
  );
}

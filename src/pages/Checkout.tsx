import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { getShippableCountries, getShippingPossibilities, getCombinedShipment, pdfPreflight } from "@/lib/printcom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [countries, setCountries] = useState<any[]>([]);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [shippingLoading, setShippingLoading] = useState(false);

  // Address form
  const [address, setAddress] = useState({
    firstName: "", lastName: "", company: "", street: "", houseNumber: "",
    city: "", postalCode: "", country: "FR", phone: "", email: "",
  });

  // File uploads per item
  const [fileUploads, setFileUploads] = useState<Record<string, { url: string; name: string }>>({});
  const [preflightResults, setPreflightResults] = useState<Record<string, any>>({});

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getShippableCountries()
      .then(data => setCountries(Array.isArray(data) ? data : data?.countries || []))
      .catch(() => {});
  }, []);

  const handleFileUpload = async (itemId: string, file: File) => {
    if (!user) { toast.error("Connectez-vous pour uploader"); return; }

    const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("print-files").upload(path, file);
    if (error) { toast.error("Erreur upload: " + error.message); return; }

    const { data: urlData } = supabase.storage.from("print-files").getPublicUrl(path);
    setFileUploads(prev => ({ ...prev, [itemId]: { url: urlData.publicUrl, name: file.name } }));
    toast.success("Fichier uploadé !");
  };

  const handlePreflight = async (itemId: string) => {
    const file = fileUploads[itemId];
    if (!file) return;
    try {
      const result = await pdfPreflight({ fileUrl: file.url, fileName: file.name });
      setPreflightResults(prev => ({ ...prev, [itemId]: result }));
      toast.success("Vérification terminée !");
    } catch (err: any) {
      toast.error("Erreur preflight: " + err.message);
    }
  };

  const calcShipping = async () => {
    setShippingLoading(true);
    try {
      const payload = {
        items: items.map(i => ({ sku: i.sku, options: i.options, quantity: i.quantity })),
        address: { country: address.country, postalCode: address.postalCode, city: address.city },
      };

      let result;
      if (items.length > 1) {
        result = await getCombinedShipment(payload);
      } else {
        result = await getShippingPossibilities(payload);
      }
      const opts = Array.isArray(result) ? result : result?.shippingOptions || result?.possibilities || [];
      setShippingOptions(opts);
      if (opts.length > 0) setSelectedShipping(opts[0]);
    } catch (err: any) {
      toast.error("Erreur livraison: " + err.message);
    } finally {
      setShippingLoading(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!user) { toast.error("Connectez-vous pour commander"); return; }
    setSubmitting(true);

    try {
      // Save address
      const { data: addrData } = await supabase.from("addresses").insert({
        user_id: user.id,
        first_name: address.firstName,
        last_name: address.lastName,
        company: address.company,
        street: address.street,
        house_number: address.houseNumber,
        city: address.city,
        postal_code: address.postalCode,
        country: address.country,
        phone: address.phone,
        email: address.email,
      }).select().single();

      // Create order
      const deduplicationId = crypto.randomUUID();
      const { data: order, error: orderErr } = await supabase.from("orders").insert({
        user_id: user.id,
        status: "pending",
        total,
        currency: "EUR",
        deduplication_id: deduplicationId,
        po_number: `J2L-${Date.now()}`,
        customer_reference: `REF-${user.id.slice(0, 8)}`,
        shipping_address_id: addrData?.id,
        billing_address_id: addrData?.id,
        shipping_method: selectedShipping,
        shipping_cost: selectedShipping?.price || 0,
      }).select().single();

      if (orderErr) throw orderErr;

      // Create order items
      const orderItems = items.map(i => ({
        order_id: order.id,
        sku: i.sku,
        product_name: i.productName,
        options: JSON.parse(JSON.stringify(i.options)),
        quantity: i.quantity,
        copies: i.copies,
        file_url: fileUploads[i.id]?.url || i.fileUrl || null,
        price_breakdown: JSON.parse(JSON.stringify({ unitPrice: i.unitPrice, total: (i.unitPrice || 0) * i.quantity })),
      }));

      await supabase.from("order_items").insert(orderItems);

      clearCart();
      toast.success("Commande créée avec succès !");
      navigate(`/account/orders`);
    } catch (err: any) {
      toast.error("Erreur commande: " + err.message);
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
      <h1 className="font-display text-3xl font-bold text-foreground">Checkout</h1>

      {/* Address */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-foreground">Adresse de livraison</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input placeholder="Prénom" value={address.firstName} onChange={e => setAddress(p => ({ ...p, firstName: e.target.value }))} />
          <Input placeholder="Nom" value={address.lastName} onChange={e => setAddress(p => ({ ...p, lastName: e.target.value }))} />
          <Input placeholder="Entreprise (optionnel)" value={address.company} onChange={e => setAddress(p => ({ ...p, company: e.target.value }))} className="sm:col-span-2" />
          <Input placeholder="Rue" value={address.street} onChange={e => setAddress(p => ({ ...p, street: e.target.value }))} />
          <Input placeholder="N°" value={address.houseNumber} onChange={e => setAddress(p => ({ ...p, houseNumber: e.target.value }))} />
          <Input placeholder="Code postal" value={address.postalCode} onChange={e => setAddress(p => ({ ...p, postalCode: e.target.value }))} />
          <Input placeholder="Ville" value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} />
          <select
            value={address.country}
            onChange={e => setAddress(p => ({ ...p, country: e.target.value }))}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="FR">France</option>
            {countries.map((c: any) => (
              <option key={c.code || c} value={c.code || c}>{c.name || c}</option>
            ))}
          </select>
          <Input placeholder="Téléphone" value={address.phone} onChange={e => setAddress(p => ({ ...p, phone: e.target.value }))} />
          <Input placeholder="Email" value={address.email} onChange={e => setAddress(p => ({ ...p, email: e.target.value }))} />
        </div>
      </section>

      {/* Files */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-foreground">Fichiers d'impression</h2>
        <div className="mt-4 space-y-4">
          {items.map(item => (
            <div key={item.id} className="rounded-lg border border-border bg-card p-4">
              <p className="font-medium text-card-foreground">{item.productName} ({item.sku})</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <Upload className="h-4 w-4" />
                  {fileUploads[item.id] ? fileUploads[item.id].name : "Uploader un PDF"}
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleFileUpload(item.id, e.target.files[0])}
                  />
                </label>
                {fileUploads[item.id] && (
                  <Button variant="outline" size="sm" onClick={() => handlePreflight(item.id)}>
                    Vérifier le fichier
                  </Button>
                )}
                {preflightResults[item.id] && (
                  <span className="flex items-center gap-1 text-sm">
                    {preflightResults[item.id].ok || preflightResults[item.id].status === "ok" ? (
                      <><CheckCircle className="h-4 w-4 text-success" /> OK</>
                    ) : (
                      <><AlertCircle className="h-4 w-4 text-warning" /> Attention</>
                    )}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shipping */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-foreground">Livraison</h2>
        <Button variant="outline" className="mt-4" onClick={calcShipping} disabled={shippingLoading || !address.postalCode}>
          {shippingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Calculer les options de livraison
        </Button>
        {shippingOptions.length > 0 && (
          <div className="mt-4 space-y-2">
            {shippingOptions.map((opt: any, i: number) => (
              <label
                key={i}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  selectedShipping === opt ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <input
                  type="radio"
                  name="shipping"
                  checked={selectedShipping === opt}
                  onChange={() => setSelectedShipping(opt)}
                  className="accent-primary"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{opt.name || opt.carrier || `Option ${i + 1}`}</p>
                  {opt.deliveryDays && <p className="text-xs text-muted-foreground">{opt.deliveryDays} jours</p>}
                </div>
                <span className="font-semibold text-foreground">{(opt.price || 0).toFixed(2)} €</span>
              </label>
            ))}
          </div>
        )}
      </section>

      {/* Submit */}
      <div className="mt-10 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total commande</p>
            <p className="text-2xl font-bold text-foreground">
              {(total + (selectedShipping?.price || 0)).toFixed(2)} €
            </p>
          </div>
          <Button size="lg" onClick={handleSubmitOrder} disabled={submitting || !user}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {user ? "Confirmer la commande" : "Connectez-vous d'abord"}
          </Button>
        </div>
      </div>
    </div>
  );
}

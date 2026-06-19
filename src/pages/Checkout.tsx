import { useState, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2, Upload, CheckCircle, Truck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { FLAT_SHIPPING_HT } from "@/lib/pricing";
import { toast } from "sonner";

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

  // Forfait de livraison fixe : 11,90 € HT, ajouté une seule fois par demande de devis.
  const productsTotalHt = total;
  const shippingHt = FLAT_SHIPPING_HT;
  const grandTotal = productsTotalHt + shippingHt;

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
        products_total_ht: productsTotalHt,
        shipping_amount_ht: shippingHt,
        estimated_total_ht: grandTotal,
        estimated_total: grandTotal,
        shipping_cost: shippingHt,
        currency: "EUR",
      });

      if (error) throw error;

      // Email de notification envoyé UNIQUEMENT après un enregistrement réussi du devis.
      const reference = `DEVIS-${requestId.slice(0, 8).toUpperCase()}`;
      try {
        const { error: mailError } = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "quote-notification",
            idempotencyKey: `quote-${requestId}`,
            replyTo: address.email,
            templateData: {
              reference,
              name: `${address.firstName} ${address.lastName}`.trim(),
              company: address.company || null,
              email: address.email,
              phone: address.phone || null,
              address: fullAddress || null,
              postalCode: address.postalCode || null,
              city: address.city || null,
              message: address.message || null,
              items: quoteItems,
              productsTotalHt,
              shippingHt,
              estimatedTotalHt: grandTotal,
            },
          },
        });
        if (mailError) console.error("Notification devis non envoyée:", mailError);
      } catch (mailErr) {
        console.error("Notification devis non envoyée:", mailErr);
      }

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
    return <Navigate to="/cart" replace />;
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

      {/* Livraison : forfait fixe */}
      <section className="mt-10">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-primary shrink-0" />
            <h2 className="font-display text-lg font-semibold text-foreground">Livraison</h2>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-foreground">Forfait livraison HT</span>
            <span className="text-sm font-semibold text-foreground">{shippingHt.toFixed(2)} €</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Forfait de livraison fixe appliqué une seule fois par commande.
          </p>
        </div>
      </section>

      <div className="mt-10 rounded-xl border border-border bg-card p-6">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total produits HT</span>
            <span className="text-foreground">{productsTotalHt.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Forfait livraison HT</span>
            <span className="text-foreground">{shippingHt.toFixed(2)} €</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between">
            <span className="text-sm font-medium text-foreground">Total estimatif HT</span>
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

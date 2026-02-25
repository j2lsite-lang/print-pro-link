import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Upload, CheckCircle, AlertCircle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { pdfPreflight } from "@/lib/printcom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Address form
  const [address, setAddress] = useState({
    firstName: "", lastName: "", company: "", street: "", houseNumber: "",
    city: "", postalCode: "", country: "FR", phone: "", email: "",
  });

  // File uploads per item
  const [fileUploads, setFileUploads] = useState<Record<string, { url: string; name: string }>>({});
  const [preflightResults, setPreflightResults] = useState<Record<string, any>>({});

  const [submitting, setSubmitting] = useState(false);

  const handleFileUpload = async (itemId: string, file: File) => {
    const userId = user?.id || "guest";
    const path = `${userId}/${crypto.randomUUID()}-${file.name}`;
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

  const handleSubmitOrder = async () => {
    if (!address.email || !address.firstName || !address.lastName) {
      toast.error("Veuillez remplir au minimum votre nom, prénom et email.");
      return;
    }
    setSubmitting(true);

    try {
      // Save address
      const { data: addrData } = await supabase.from("addresses").insert({
        user_id: user?.id || null,
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
        user_id: user?.id || null,
        status: "pending",
        total,
        currency: "EUR",
        deduplication_id: deduplicationId,
        po_number: `J2L-${Date.now()}`,
        customer_reference: `REF-${address.email}`,
        shipping_address_id: addrData?.id,
        billing_address_id: addrData?.id,
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
      toast.success("Demande de devis envoyée avec succès !");
      navigate("/");
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
      <h1 className="font-display text-3xl font-bold text-foreground">Demande de devis</h1>

      {/* Address */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-foreground">Vos coordonnées</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input placeholder="Prénom *" value={address.firstName} onChange={e => setAddress(p => ({ ...p, firstName: e.target.value }))} />
          <Input placeholder="Nom *" value={address.lastName} onChange={e => setAddress(p => ({ ...p, lastName: e.target.value }))} />
          <Input placeholder="Email *" type="email" value={address.email} onChange={e => setAddress(p => ({ ...p, email: e.target.value }))} className="sm:col-span-2" />
          <Input placeholder="Entreprise (optionnel)" value={address.company} onChange={e => setAddress(p => ({ ...p, company: e.target.value }))} className="sm:col-span-2" />
          <Input placeholder="Rue" value={address.street} onChange={e => setAddress(p => ({ ...p, street: e.target.value }))} />
          <Input placeholder="N°" value={address.houseNumber} onChange={e => setAddress(p => ({ ...p, houseNumber: e.target.value }))} />
          <Input placeholder="Code postal" value={address.postalCode} onChange={e => setAddress(p => ({ ...p, postalCode: e.target.value }))} />
          <Input placeholder="Ville" value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} />
          <Input placeholder="Téléphone" value={address.phone} onChange={e => setAddress(p => ({ ...p, phone: e.target.value }))} />
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

      {/* Shipping info */}
      <section className="mt-10">
        <div className="rounded-lg border border-border bg-card p-6 flex items-start gap-4">
          <Truck className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="font-display text-lg font-semibold text-foreground">Livraison</h2>
            <p className="text-sm text-muted-foreground">
              Les frais de livraison seront calculés et inclus dans votre devis personnalisé.
            </p>
            <Link to="/livraison" className="text-sm text-primary hover:underline inline-block mt-1">
              Consulter nos informations de livraison →
            </Link>
          </div>
        </div>
      </section>

      {/* Submit */}
      <div className="mt-10 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total estimé (hors livraison)</p>
            <p className="text-2xl font-bold text-foreground">
              {total.toFixed(2)} €
            </p>
          </div>
          <Button size="lg" onClick={handleSubmitOrder} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Demander un devis
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2, Upload, CheckCircle, Truck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { getSupplierPrice, hasSupplierPrice } from "@/lib/pricing";
import { getProduct, getPrice } from "@/lib/printcom";
import { supplierQuantities, supplierSelection } from "@/lib/supplier-quantities";
import { toast } from "sonner";
import { trackGenerateLead } from "@/lib/analytics";
import { useShipping } from "@/hooks/useShipping";
import { ShippingFields } from "@/components/cart/ShippingFields";
import { QuoteTotals } from "@/components/cart/QuoteTotals";

export default function Checkout() {
  const { items, total, clearCart, deliveryAddress, setDeliveryAddress, shippingMethod, setShippingMethod } = useCart();
  const shipping = useShipping(items, deliveryAddress, shippingMethod);
  const navigate = useNavigate();

  // Unique request id generated up-front so uploads land in this request's folder.
  const requestIdRef = useRef<string>(crypto.randomUUID());
  const requestId = requestIdRef.current;

  const [address, setAddress] = useState({
    firstName: "", lastName: "", company: "", street: deliveryAddress.street || "", houseNumber: deliveryAddress.houseNumber || "",
    city: deliveryAddress.city || "", postalCode: deliveryAddress.postalCode || "", country: deliveryAddress.country, phone: "", email: "", message: "",
  });

  const [fileUploads, setFileUploads] = useState<Record<string, { url: string; name: string; path: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  // Verrou d'envoi : empêche tout second appel (double-clic) de créer
  // une deuxième demande et donc un deuxième e-mail interne.
  const submittingRef = useRef(false);

  const productsTotalHt = total;
  const fullyPriced = items.every((item) => item.unitPrice != null && item.unitPrice > 0);

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
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    try {
      // Revalidate exact stored configurations against live supplier data. Fail closed.
      for (const item of items) {
        if (!item.configuration || !Number.isSafeInteger(item.copies) || item.copies <= 0
          || Number(item.configuration.copies) !== item.copies) {
          throw new Error(`Reconfigurez « ${item.productName} » avant de demander un devis.`);
        }
        const product = await getProduct(item.sku);
        const props = product.properties || product.configurableProperties || [];
        const allowed = supplierQuantities(props.find((p: { slug: string }) => p.slug === "copies"), supplierSelection(product, item.configuration), product.excludes);
        if (!allowed.includes(item.copies)) throw new Error(`Quantité indisponible pour « ${item.productName} ». Reconfigurez ce produit.`);
        const price = await getPrice(item.sku, item.configuration);
        if (price?.error || price?.errorMessage || !hasSupplierPrice(price)) {
          throw new Error(`Configuration indisponible pour « ${item.productName} ». Aucun devis envoyé.`);
        }
        if (Math.abs(getSupplierPrice(price) - (item.supplierPriceHT ?? 0)) > 0.00001) {
          throw new Error(`Le tarif de « ${item.productName} » a changé. Reconfigurez ce produit avant de demander un devis.`);
        }
      }
      const fullAddress = [deliveryAddress.houseNumber, deliveryAddress.street].filter(Boolean).join(" ");

      const quoteItems = items.map(i => ({
        product_name: i.productName,
        sku: i.sku,
        quantity: i.quantity,
        copies: i.copies,
        options: i.options,
        configuration: i.configuration || null,
        unit_price: i.unitPrice,
        line_total: i.unitPrice != null ? i.unitPrice * i.quantity : null,
        currency: i.currency,
        file_url: fileUploads[i.id]?.url || i.fileUrl || null,
        file_name: fileUploads[i.id]?.name || i.originalFileName || null,
      }));

      // Server re-prices every line from live Print.com data and records the quote.
      const reference = `DEVIS-${requestId.slice(0, 8).toUpperCase()}`;
      const { data: saved, error } = await supabase.functions.invoke("submit-quote", {
        body: {
          reference,
          deliveryAddress,
          shippingMethod: shippingMethod || shipping.selectedMethod || undefined,
          name: `${address.firstName} ${address.lastName}`.trim(),
          company: address.company || null,
          email: address.email,
          phone: address.phone || null,
          address: fullAddress || null,
          postal_code: deliveryAddress.postalCode || null,
          city: deliveryAddress.city || null,
          message: address.message || null,
          items: items.map((i) => ({
            productName: i.productName,
            sku: i.sku,
            quantity: i.quantity,
            copies: i.copies,
            configuration: i.configuration,
            options: i.options,
            includeDesignFee: !!i.includeDesignFee,
            fileUrl: fileUploads[i.id]?.url || i.fileUrl || null,
            fileName: fileUploads[i.id]?.name || i.originalFileName || null,
          })),
        },
      });
      if (error) {
        let detail = "";
        try { detail = (await (error as any).context?.json())?.error ?? ""; } catch { /* ignore */ }
        throw new Error(detail || "Demande de devis refusée : configuration à vérifier.");
      }
      if (!saved?.reference) throw new Error("Demande de devis non enregistrée.");

      // Email de notification envoyé UNIQUEMENT après un enregistrement réussi du devis.
      try {
        const { error: mailError } = await supabase.functions.invoke("send-quote-smtp", {
          body: {
            type: "devis",
            reference,
            firstName: address.firstName,
            lastName: address.lastName,
            name: `${address.firstName} ${address.lastName}`.trim(),
            company: address.company || null,
            email: address.email,
            phone: address.phone || null,
            address: fullAddress || null,
            postalCode: deliveryAddress.postalCode || null,
            city: deliveryAddress.city || null,
            message: address.message || null,
            pageUrl: window.location.href,
            items: (saved.items as typeof quoteItems).map((i) => ({
              productName: i.product_name,
              sku: i.sku,
              quantity: i.quantity,
              dimensions:
                (i.options && (i.options.format || i.options.dimensions || i.options.size)) || null,
              options: i.options,
              fileName: i.file_name,
              fileUrl: i.file_url,
            })),
            productsTotalHt: saved.productsTotalHt,
            shippingHt: saved.shippingHt,
            vatAmount: saved.vatAmount,
            estimatedTotalTtc: saved.estimatedTotalTtc,
            estimatedTotalHt: saved.estimatedTotalHt,
          },
        });
        if (mailError) console.error("Notification devis non envoyée:", mailError);
      } catch (mailErr) {
        console.error("Notification devis non envoyée:", mailErr);
      }


      clearCart();
      trackGenerateLead("devis_panier");
      toast.success("Demande de devis envoyée avec succès ! Nous vous recontactons rapidement.");
      navigate("/");
    } catch (err: any) {
      toast.error("Erreur: " + err.message);
    } finally {
      submittingRef.current = false;
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

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-xl font-semibold flex items-center gap-3"><Truck className="h-5 w-5 text-primary" />Adresse de livraison</h2>
        <ShippingFields address={deliveryAddress} onChange={setDeliveryAddress} method={shippingMethod} onMethod={setShippingMethod} choices={shipping.choices} loading={shipping.loading} />
      </section>
      <div className="mt-10 rounded-xl border border-border bg-card p-6">
        <div className="mb-4"><QuoteTotals productsHt={productsTotalHt} shippingHt={shipping.shippingHt} fullyPriced={fullyPriced} country={deliveryAddress.country} postalCode={deliveryAddress.postalCode} /></div>
        <Button size="lg" className="w-full" onClick={handleSubmitQuote} disabled={submitting || shipping.loading}>
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

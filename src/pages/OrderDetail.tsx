import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Package, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getOrder } from "@/lib/realisaprint";

export default function OrderDetail() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [printcomData, setPrintcomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !orderNumber) return;

    const load = async () => {
      // Try to find by printcom_order_number or id
      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .or(`printcom_order_number.eq.${orderNumber},id.eq.${orderNumber}`)
        .eq("user_id", user.id)
        .single();

      if (orderData) {
        setOrder(orderData);
        const { data: itemsData } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderData.id);
        setItems(itemsData || []);

        // Try to get Print.com status
        if (orderData.printcom_order_number) {
          try {
            const pcData = await getOrder(orderData.printcom_order_number);
            setPrintcomData(pcData);
          } catch {}
        }
      }
      setLoading(false);
    };
    load();
  }, [user, orderNumber]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!order) {
    return <div className="container py-20 text-center text-muted-foreground">Commande introuvable.</div>;
  }

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="font-display text-3xl font-bold text-foreground">
        Commande {order.po_number || order.id.slice(0, 8)}
      </h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Statut</p>
          <p className="mt-1 font-semibold text-foreground capitalize">{order.status}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="mt-1 font-semibold text-foreground">{Number(order.total || 0).toFixed(2)} €</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Date</p>
          <p className="mt-1 font-semibold text-foreground">{new Date(order.created_at).toLocaleDateString("fr-FR")}</p>
        </div>
        {order.printcom_order_number && (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">N° Print.com</p>
            <p className="mt-1 font-semibold text-foreground">{order.printcom_order_number}</p>
          </div>
        )}
      </div>

      {/* Tracking */}
      {printcomData?.tracking && (
        <div className="mt-6 rounded-lg border border-success/20 bg-success/5 p-4">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-success" />
            <p className="font-medium text-foreground">Suivi de livraison</p>
          </div>
          <a href={printcomData.tracking.url} target="_blank" rel="noopener" className="mt-2 block text-sm text-primary hover:underline">
            {printcomData.tracking.carrier}: {printcomData.tracking.trackingNumber}
          </a>
        </div>
      )}

      {/* Items */}
      <h2 className="mt-8 font-display text-xl font-semibold text-foreground">Articles</h2>
      <div className="mt-4 space-y-3">
        {items.map(item => (
          <div key={item.id} className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
            <Package className="mt-1 h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium text-card-foreground">{item.product_name}</p>
              <p className="text-sm text-muted-foreground">SKU: {item.sku} · Qté: {item.quantity}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

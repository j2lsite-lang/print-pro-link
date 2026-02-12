import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Package, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  queued: "bg-info/10 text-info border-info/20",
  processing: "bg-primary/10 text-primary border-primary/20",
  shipped: "bg-success/10 text-success border-success/20",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders(data || []);
        setLoading(false);
      });
  }, [user]);

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Connectez-vous pour voir vos commandes.</p>
        <Link to="/auth" className="mt-4 inline-block text-primary hover:underline">Se connecter</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold text-foreground">Mes commandes</h1>

      {orders.length === 0 ? (
        <div className="mt-10 flex flex-col items-center py-10">
          <Package className="h-16 w-16 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">Aucune commande pour le moment.</p>
          <Link to="/products" className="mt-4 text-primary hover:underline">Découvrir le catalogue</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map(order => (
            <Link
              key={order.id}
              to={`/account/orders/${order.printcom_order_number || order.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-elevated"
            >
              <div>
                <p className="font-display font-semibold text-card-foreground">
                  {order.po_number || `Commande ${order.id.slice(0, 8)}`}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusColors[order.status] || ""}`}>
                  {order.status}
                </span>
                <span className="font-semibold text-foreground">{Number(order.total || 0).toFixed(2)} €</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

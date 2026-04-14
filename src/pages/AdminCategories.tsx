import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CategoryStat {
  name: string;
  count: number;
  parent_name: string | null;
}

export default function AdminCategories() {
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [result, setResult] = useState<{ totalProducts?: number; totalMappings: number; imagesUpdated?: number } | null>(null);
  const [stats, setStats] = useState<CategoryStat[]>([]);

  const loadStats = async () => {
    const { data: cats } = await supabase.from("product_categories").select("id, name, parent_id").order("sort_order");
    if (!cats) return;

    const { data: mappings } = await supabase.from("product_category_mappings").select("category_id");
    if (!mappings) return;

    const countMap: Record<string, number> = {};
    for (const m of mappings) {
      countMap[m.category_id] = (countMap[m.category_id] || 0) + 1;
    }

    const results: CategoryStat[] = cats.map(c => ({
      name: c.name,
      count: countMap[c.id] || 0,
      parent_name: c.parent_id ? cats.find(p => p.id === c.parent_id)?.name || null : null,
    }));

    setStats(results);
  };

  useEffect(() => { loadStats(); }, []);

  const handleSyncMappings = async () => {
    setSyncLoading(true);
    setResult(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-category-mappings`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ triggered_by: "admin" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur inconnue");

      setResult(data);
      toast.success(`${data.totalMappings} associations synchronisées !`);
      loadStats();
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleMapCategories = async () => {
    setLoading(true);
    setResult(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/map-categories`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur inconnue");

      setResult(data);
      toast.success(`${data.totalMappings} associations créées !`);
      loadStats();
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const parentCats = stats.filter(s => !s.parent_name);
  const subCats = stats.filter(s => !!s.parent_name);

  return (
    <div className="container py-10 max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-foreground">Administration des catégories</h1>
      <p className="mt-2 text-muted-foreground">
        Gérez les associations produits-catégories. Un cron automatique tourne chaque lundi à 3h.
      </p>

      {/* Sync déterministe (recommandé) */}
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold text-card-foreground">Synchronisation CMS (recommandé)</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Synchronise les produits avec les catégories en lisant directement le CMS fournisseur.
          Rapide, gratuit, déterministe. Exécuté automatiquement chaque lundi.
        </p>

        <div className="mt-4 flex gap-3">
          <Button onClick={handleSyncMappings} disabled={syncLoading || loading}>
            {syncLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {syncLoading ? "Synchronisation…" : "Synchroniser maintenant"}
          </Button>
        </div>
      </div>

      {/* Mapping IA (legacy) */}
      <div className="mt-4 rounded-xl border border-border bg-card p-6 opacity-70">
        <h2 className="font-display text-lg font-semibold text-card-foreground">Mapping par IA (legacy)</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Utilise l'IA pour classer les produits. Plus lent et consomme des crédits.
          Utile uniquement si de nouvelles catégories sont ajoutées.
        </p>

        <div className="mt-4 flex gap-3">
          <Button variant="outline" onClick={handleMapCategories} disabled={loading || syncLoading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            {loading ? "Mapping en cours…" : "Lancer le mapping IA"}
          </Button>
        </div>
      </div>

      {result && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-border bg-muted p-4">
          <CheckCircle className="mt-0.5 h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Opération terminée !</p>
            <p className="text-sm text-muted-foreground">
              {result.totalMappings} associations
              {result.imagesUpdated != null && ` — ${result.imagesUpdated} images mises à jour`}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats.length > 0 && (
        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-card-foreground mb-4">Statistiques</h2>

          <h3 className="text-sm font-medium text-muted-foreground mb-2">Catégories principales</h3>
          <div className="space-y-1 mb-6">
            {parentCats.map(s => (
              <div key={s.name} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-muted/50">
                <span className="text-sm text-foreground">{s.name}</span>
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {s.count} produits
                </span>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-medium text-muted-foreground mb-2">Sous-catégories</h3>
          <div className="space-y-1">
            {subCats.map(s => (
              <div key={s.name} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-muted/50">
                <span className="text-sm text-foreground">
                  <span className="text-muted-foreground">{s.parent_name} &gt; </span>
                  {s.name}
                </span>
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {s.count} produits
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

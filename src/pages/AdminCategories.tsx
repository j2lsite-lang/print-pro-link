import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminCategories() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ totalProducts: number; totalMappings: number } | null>(null);

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
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur inconnue");

      setResult(data);
      toast.success(`${data.totalMappings} associations créées pour ${data.totalProducts} produits !`);
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10 max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-foreground">Administration des catégories</h1>
      <p className="mt-2 text-muted-foreground">
        Associez automatiquement les produits Print.com aux catégories en utilisant l'IA.
      </p>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold text-card-foreground">Mapping automatique par IA</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          L'IA va analyser le nom de chaque produit et l'associer aux catégories les plus pertinentes.
          Cette opération peut prendre quelques minutes.
        </p>

        <Button
          className="mt-4"
          onClick={handleMapCategories}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          {loading ? "Mapping en cours…" : "Lancer le mapping IA"}
        </Button>

        {result && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-border bg-muted p-4">
            <CheckCircle className="mt-0.5 h-5 w-5 text-green-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Mapping terminé !</p>
              <p className="text-sm text-muted-foreground">
                {result.totalProducts} produits analysés — {result.totalMappings} associations créées.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

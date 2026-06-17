import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ChevronRight } from "lucide-react";
import { useThemes } from "@/hooks/useThemes";
import { useSEO } from "@/hooks/useSEO";
import { fetchAllProductThemeMappings } from "@/lib/theme-mappings";

export default function Themes() {
  const { themes, loading } = useThemes();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useSEO({
    title: "Thèmes & collections – Impression en ligne | J2L Print",
    description:
      "Explorez nos thèmes : Écologique, Nouveautés, Hôtels & restaurants, Bureau, Saison estivale et plus. Retrouvez les produits J2L Print associés à chaque thème.",
  });

  useEffect(() => {
    if (themes.length === 0) return;
    fetchAllProductThemeMappings().then((mappings) => {
      const c: Record<string, number> = {};
      for (const t of themes) {
        c[t.id] = new Set(mappings.filter((m) => m.theme_id === t.id).map((m) => m.sku)).size;
      }
      setCounts(c);
    });
  }, [themes]);

  return (
    <div className="container py-10">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/products" className="transition-colors hover:text-foreground">Catalogue</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Thèmes</span>
      </nav>

      <p className="text-sm font-medium uppercase tracking-wide text-primary">Collections</p>
      <h1 className="mt-2 font-display text-4xl font-bold text-foreground">Thèmes</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        Parcourez nos thèmes pour trouver rapidement les produits adaptés à chaque occasion et secteur.
      </p>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && themes.length > 0 && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {themes.map((theme) => (
            <Link
              key={theme.id}
              to={`/themes/${theme.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-elevated"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted/50">
                {theme.image_url ? (
                  <img
                    src={theme.image_url}
                    alt={theme.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-5xl opacity-20">🎨</span>
                  </div>
                )}
              </div>
              <div className="flex items-baseline justify-between gap-2 px-4 py-3.5">
                <h2 className="truncate font-display text-sm font-semibold text-card-foreground transition-colors group-hover:text-primary">
                  {theme.name}
                </h2>
                {counts[theme.id] != null && (
                  <span className="shrink-0 text-xs text-muted-foreground">({counts[theme.id]})</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && themes.length === 0 && (
        <p className="mt-10 py-10 text-center text-muted-foreground">Aucun thème disponible pour le moment.</p>
      )}
    </div>
  );
}

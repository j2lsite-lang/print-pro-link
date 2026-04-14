import { Link } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import { useCities } from "@/hooks/useCities";
import { useSEO } from "@/hooks/useSEO";
import { Skeleton } from "@/components/ui/skeleton";

export default function CitiesIndex() {
  const { data: cities, isLoading } = useCities();

  useSEO({
    title: "Imprimerie en ligne partout en France – Zones de livraison",
    description: "J2L Print livre vos impressions dans toute la France : Paris, Lyon, Marseille, Strasbourg, Nancy, Épinal et plus de 270 villes. Imprimerie en ligne avec livraison rapide.",
  });

  const regions = cities
    ? [...new Set(cities.map((c) => c.region))].sort()
    : [];

  return (
    <section className="py-12">
      <div className="container max-w-4xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-4">
          Imprimerie en ligne partout en France
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-10">
          J2L Print livre vos impressions dans toute la France. Retrouvez ci-dessous nos {cities?.length || ""} zones de livraison. 
          Que vous soyez à Paris, Lyon, Marseille ou dans les Vosges, nous vous accompagnons avec la même 
          qualité de service et des délais rapides.
        </p>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-40" />
                <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-10" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          regions.map((region) => (
            <div key={region} className="mb-8">
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">{region}</h2>
              <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4">
                {cities!
                  .filter((c) => c.region === region)
                  .map((city) => (
                    <Link
                      key={city.slug}
                      to={`/imprimerie/${city.slug}`}
                      className="glass-card px-4 py-3 text-sm text-muted-foreground hover:text-primary hover:shadow-elevated transition-all flex items-center gap-2"
                    >
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      Imprimerie {city.name}
                    </Link>
                  ))}
              </div>
            </div>
          ))
        )}

        <div className="mt-10 glass-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            Votre ville n'est pas listée ?
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Pas de panique ! Nous livrons dans toute la France métropolitaine. 
            Contactez-nous pour obtenir un devis personnalisé.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/#devis" className="pill font-semibold text-sm flex items-center gap-1">
              Demander un devis <ArrowRight className="h-3 w-3" />
            </Link>
            <Link to="/products" className="pill font-semibold text-sm flex items-center gap-1">
              Voir le catalogue <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

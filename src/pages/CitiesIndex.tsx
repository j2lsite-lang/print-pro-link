import { Link } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import { useCities } from "@/hooks/useCities";
import { useSEO } from "@/hooks/useSEO";
import { Skeleton } from "@/components/ui/skeleton";

// The only cities currently published as real, indexable pages (/ville/{slug}).
// Keep this list in sync with PRIORITY_CITIES in scripts/seo/build-pages.ts.
const PUBLISHED_CITY_SLUGS = new Set([
  "epinal", "nancy", "metz", "strasbourg", "colmar", "mulhouse", "reims",
  "troyes", "saint-die-des-vosges", "remiremont", "neufchateau", "luneville",
  "thionville", "sarreguemines", "verdun", "chaumont",
]);

export default function CitiesIndex() {
  const { data: allCities, isLoading } = useCities();

  // Only show cities that have a real, published page — never link to weak,
  // duplicated or noindex local pages.
  const cities = (allCities || []).filter((c) => PUBLISHED_CITY_SLUGS.has(c.slug));

  useSEO({
    title: "Nos villes desservies – Imprimerie en ligne J2L Print",
    description:
      "Découvrez les villes desservies par J2L Print : impression professionnelle livrée à Épinal, Nancy, Metz, Strasbourg, Mulhouse, Reims et dans le Grand Est.",
    canonical: "https://j2lprint.fr/imprimerie",
  });

  const regions = cities.length
    ? [...new Set(cities.map((c) => c.region))].sort()
    : [];

  return (
    <section className="py-12">
      <div className="container max-w-4xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-4">
          Nos villes desservies
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-10">
          J2L Print imprime et livre vos supports de communication partout en France.
          Retrouvez ci-dessous les villes pour lesquelles nous avons préparé une page
          dédiée. Votre ville n'y figure pas&nbsp;? Nous livrons malgré tout l'ensemble
          du territoire&nbsp;: demandez simplement un devis.
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
                {cities
                  .filter((c) => c.region === region)
                  .map((city) => (
                    <Link
                      key={city.slug}
                      to={`/ville/${city.slug}`}
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

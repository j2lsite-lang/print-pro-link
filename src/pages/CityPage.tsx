import { useParams, Link } from "react-router-dom";
import { ArrowRight, MapPin, Phone, Mail, Printer, Truck, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import { useCity, useCities } from "@/hooks/useCities";
import { Skeleton } from "@/components/ui/skeleton";

export default function CityPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: city, isLoading } = useCity(slug);
  const { data: allCities } = useCities();

  const otherCities = (allCities || []).filter((c) => c.slug !== slug).slice(0, 12);

  useSEO({
    title: city ? `Imprimerie en ligne à ${city.name} (${city.cp}) – Livraison rapide` : "Imprimerie en ligne",
    description: city
      ? `J2L Print, votre imprimerie en ligne pour ${city.name}. Flyers, cartes de visite, affiches, bâches, objets publicitaires. Livraison à ${city.name} en 3-5 jours.`
      : "",
  });

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container max-w-4xl space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </section>
    );
  }

  if (!city) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground mb-4">Ville non trouvée</h1>
        <Link to="/imprimerie" className="text-primary hover:underline">Voir toutes nos zones de livraison</Link>
      </div>
    );
  }

  return (
    <section className="py-12">
      <div className="container max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Accueil</Link>
          <span>/</span>
          <Link to="/imprimerie" className="hover:text-primary">Imprimerie en ligne</Link>
          <span>/</span>
          <span className="text-foreground">{city.name}</span>
        </div>

        <h1 className="font-display text-3xl font-bold text-foreground mb-4">
          Imprimerie en ligne à {city.name} ({city.cp})
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          <strong>J2L Print</strong> est votre imprimerie en ligne pour {city.name} et sa région ({city.region}). 
          Nous livrons vos impressions directement à {city.name} : flyers, cartes de visite, affiches, bâches, 
          adhésifs, roll-ups, objets publicitaires et bien plus. Commandez en ligne, recevez chez vous ou 
          à votre entreprise à {city.name}.
        </p>

        {/* Services */}
        <div className="grid gap-4 sm:grid-cols-3 mb-10">
          <div className="glass-card p-5 text-center">
            <Printer className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-display text-sm font-semibold text-foreground">Impression pro</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Offset & numérique, qualité professionnelle pour vos supports à {city.name}
            </p>
          </div>
          <div className="glass-card p-5 text-center">
            <Truck className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-display text-sm font-semibold text-foreground">Livraison à {city.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Expédition rapide en 3-5 jours ouvrés directement à {city.name}
            </p>
          </div>
          <div className="glass-card p-5 text-center">
            <CheckCircle className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-display text-sm font-semibold text-foreground">Devis gratuit</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Devis personnalisé sous 24h pour les professionnels de {city.name}
            </p>
          </div>
        </div>

        {/* Description SEO */}
        <div className="glass-card p-6 mb-8 space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground">
            Pourquoi choisir J2L Print pour vos impressions à {city.name} ?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Basée dans les Vosges, l'entreprise <strong>J2L Publicité</strong> (marque J2L Print) accompagne 
            depuis 2012 les professionnels, associations et collectivités dans leurs projets de communication 
            visuelle. Grâce à notre plateforme en ligne, les entreprises de {city.name} bénéficient des mêmes 
            services et tarifs compétitifs que nos clients locaux.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Que vous ayez besoin de <Link to="/products" className="text-primary hover:underline">cartes de visite, flyers, dépliants</Link>, 
            d'<Link to="/products" className="text-primary hover:underline">affiches grand format</Link>, 
            de bâches publicitaires, de signalétique ou d'
            <Link to="/products" className="text-primary hover:underline">objets publicitaires personnalisés</Link>, 
            nous produisons et expédions vos commandes directement à {city.name} ({city.cp}).
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Notre équipe assure un <strong>contrôle qualité</strong> sur chaque commande avec vérification 
            automatique de vos fichiers PDF. Vous pouvez également nous confier la 
            <strong> conception de vos maquettes</strong> à partir de 65 € HT.
          </p>
        </div>

        {/* CTA */}
        <div className="glass-card p-6 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Besoin d'un devis à {city.name} ?
            </h3>
            <p className="text-sm text-muted-foreground">Réponse sous 24h, livraison rapide.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full">
              <Link to="/#devis">
                Demander un devis <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <a href="tel:+33329304479" className="pill font-semibold flex items-center gap-1.5">
              <Phone className="h-4 w-4" /> 03 29 30 44 79
            </a>
          </div>
        </div>

        {/* Contact */}
        <div className="glass-card p-6 mb-10">
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            Contactez J2L Print depuis {city.name}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 text-primary" /> 
              <a href="tel:+33329304479" className="hover:text-primary">03 29 30 44 79</a>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 text-primary" /> 
              <a href="mailto:contact@j2lpublicite.fr" className="hover:text-primary">contact@j2lpublicite.fr</a>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
              <MapPin className="h-4 w-4 text-primary" /> 
              22 B rue Robert Barret, 88390 Uxegney (siège) — Livraison à {city.name} et dans toute la France
            </div>
          </div>
        </div>

        {/* Maillage interne */}
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Imprimerie en ligne dans d'autres villes
          </h2>
          <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                to={`/imprimerie/${c.slug}`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                <MapPin className="h-3 w-3" /> Imprimerie {c.name}
              </Link>
            ))}
            <Link
              to="/imprimerie"
              className="text-sm text-primary font-medium flex items-center gap-1"
            >
              Voir toutes les villes <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Liens internes */}
        <div className="mt-8 glass-card p-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">Liens utiles</h3>
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <Link to="/products" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-primary" /> Catalogue produits
            </Link>
            <Link to="/blog" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-primary" /> Blog & conseils impression
            </Link>
            <Link to="/livraison" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-primary" /> Informations livraison
            </Link>
            <Link to="/#devis" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-primary" /> Devis gratuit en ligne
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

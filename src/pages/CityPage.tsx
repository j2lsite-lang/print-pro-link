import { useParams, Link } from "react-router-dom";
import { ArrowRight, MapPin, Phone, Mail, Printer, Truck, CheckCircle, FileText, Image, Shirt } from "lucide-react";
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
    title: city ? `Imprimerie en ligne à ${city.name} (${city.cp}) – Flyers, bâches, objets pub` : "Imprimerie en ligne",
    description: city
      ? `Imprimerie en ligne à ${city.name} (${city.cp}). Impression flyers, cartes de visite, bâches, roll-ups, objets publicitaires. Livraison rapide à ${city.name}. Devis gratuit J2L Print.`
      : "",
    jsonLd: city ? [
      {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: `J2L Print – Imprimerie à ${city.name}`,
        description: `Imprimerie en ligne livrant à ${city.name} (${city.cp}) : flyers, cartes de visite, bâches, roll-ups, objets publicitaires.`,
        url: `https://j2lprint.fr/imprimerie/${city.slug}`,
        telephone: "+33329304479",
        email: "contact@j2lpublicite.fr",
        areaServed: {
          "@type": "City",
          name: city.name,
          ...(city.cp ? { postalCode: city.cp } : {}),
          ...(city.region ? { containedInPlace: { "@type": "AdministrativeArea", name: city.region } } : {}),
        },
        address: {
          "@type": "PostalAddress",
          streetAddress: "22 B rue Robert Barret",
          postalCode: "88390",
          addressLocality: "Uxegney",
          addressRegion: "Vosges",
          addressCountry: "FR",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: "https://j2lprint.fr/" },
          { "@type": "ListItem", position: 2, name: "Imprimerie en ligne", item: "https://j2lprint.fr/imprimerie" },
          { "@type": "ListItem", position: 3, name: city.name, item: `https://j2lprint.fr/imprimerie/${city.slug}` },
        ],
      },
    ] : undefined,
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
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Accueil</Link>
          <span>/</span>
          <Link to="/imprimerie" className="hover:text-primary">Imprimerie en ligne</Link>
          <span>/</span>
          <span className="text-foreground">{city.name}</span>
        </div>

        {/* H1 enrichi */}
        <h1 className="font-display text-3xl font-bold text-foreground mb-4">
          Imprimerie en ligne à {city.name} ({city.cp}) – Impression & livraison rapide
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          <strong>J2L Print</strong> est votre <strong>imprimerie en ligne</strong> pour {city.name} et sa région ({city.region}). 
          Nous produisons et livrons à {city.name} : <strong>flyers</strong>, <strong>cartes de visite</strong>, <strong>affiches</strong>, 
          <strong>bâches publicitaires</strong>, <strong>adhésifs</strong>, <strong>roll-ups</strong>, 
          <strong>objets publicitaires personnalisés</strong> et bien plus. Commandez en ligne, recevez chez vous ou 
          à votre entreprise à {city.name}.
        </p>

        {/* Services avec liens internes */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          <Link to="/impression-numerique" className="glass-card p-5 text-center hover:shadow-elevated transition-all group">
            <FileText className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-display text-sm font-semibold text-foreground group-hover:text-primary">Impression numérique</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Flyers, cartes de visite, dépliants, affiches pour {city.name}
            </p>
          </Link>
          <Link to="/grand-format" className="glass-card p-5 text-center hover:shadow-elevated transition-all group">
            <Image className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-display text-sm font-semibold text-foreground group-hover:text-primary">Grand format</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Bâches, banderoles, adhésifs, enseignes à {city.name}
            </p>
          </Link>
          <Link to="/supports-publicitaires" className="glass-card p-5 text-center hover:shadow-elevated transition-all group">
            <Printer className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-display text-sm font-semibold text-foreground group-hover:text-primary">Supports publicitaires</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Roll-ups, totems, PLV, signalétique à {city.name}
            </p>
          </Link>
          <Link to="/personnalisation" className="glass-card p-5 text-center hover:shadow-elevated transition-all group">
            <Shirt className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-display text-sm font-semibold text-foreground group-hover:text-primary">Personnalisation</h3>
            <p className="text-xs text-muted-foreground mt-1">
              T-shirts, mugs, goodies personnalisés à {city.name}
            </p>
          </Link>
        </div>

        {/* Livraison */}
        <div className="grid gap-4 sm:grid-cols-3 mb-10">
          <div className="glass-card p-5 text-center">
            <Truck className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-display text-sm font-semibold text-foreground">Livraison à {city.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Expédition rapide en 3-5 jours ouvrés directement à {city.name} ({city.cp})
            </p>
          </div>
          <div className="glass-card p-5 text-center">
            <CheckCircle className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-display text-sm font-semibold text-foreground">Devis gratuit</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Devis personnalisé sous 24h pour les professionnels de {city.name}
            </p>
          </div>
          <div className="glass-card p-5 text-center">
            <FileText className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-display text-sm font-semibold text-foreground">Vérification fichiers</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Contrôle qualité automatique de vos PDF avant impression
            </p>
          </div>
        </div>

        {/* Contenu SEO enrichi avec mots-clés */}
        <div className="glass-card p-6 mb-8 space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground">
            Pourquoi choisir J2L Print pour vos impressions à {city.name} ?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Basée dans les Vosges, l'entreprise <strong>J2L Publicité</strong> (marque J2L Print) accompagne 
            depuis 2012 les professionnels, associations et collectivités de {city.name} dans leurs projets de 
            <strong> communication visuelle</strong>. Grâce à notre plateforme en ligne, les entreprises de {city.name} ({city.cp}) 
            bénéficient des mêmes services et tarifs compétitifs que nos clients locaux.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Que vous ayez besoin d'<Link to="/impression-numerique" className="text-primary hover:underline">impression de flyers à {city.name}</Link>, 
            de <Link to="/impression-numerique" className="text-primary hover:underline">cartes de visite professionnelles</Link>, 
            d'<Link to="/grand-format" className="text-primary hover:underline">affiches et bâches grand format</Link>, 
            de <Link to="/supports-publicitaires" className="text-primary hover:underline">roll-ups et signalétique pour salons</Link> ou 
            d'<Link to="/personnalisation" className="text-primary hover:underline">objets publicitaires personnalisés</Link>, 
            nous produisons et expédions vos commandes directement à {city.name}.
          </p>

          <h3 className="font-display text-lg font-semibold text-foreground pt-2">
            Nos services d'impression à {city.name}
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
            {[
              `Impression flyers et dépliants à ${city.name}`,
              `Cartes de visite professionnelles ${city.name}`,
              `Bâches et banderoles publicitaires ${city.cp}`,
              `Roll-ups et supports de salon ${city.name}`,
              `Adhésifs et vinyles personnalisés`,
              `T-shirts et textiles brodés à votre logo`,
              `Objets publicitaires et goodies ${city.name}`,
              `Enseignes et panneaux pour commerce`,
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Section qualité */}
        <div className="glass-card p-6 mb-8 space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground">
            Qualité et garanties pour les entreprises de {city.name}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Notre équipe assure un <strong>contrôle qualité</strong> sur chaque commande avec vérification 
            automatique de vos fichiers PDF : résolution, fonds perdus, colorimétrie CMJN. Vous pouvez 
            également nous confier la <strong>conception de vos maquettes</strong> à partir de 65 € HT.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nous utilisons des <strong>encres éco-solvant et latex</strong> certifiées, des papiers 
            <strong> FSC et PEFC</strong>, et proposons un suivi de commande en ligne. Les entreprises 
            de {city.name} nous font confiance pour la qualité et la fiabilité de nos impressions.
          </p>
        </div>

        {/* CTA */}
        <div className="glass-card p-6 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Besoin d'un devis d'impression à {city.name} ?
            </h3>
            <p className="text-sm text-muted-foreground">Réponse sous 24h, livraison rapide à {city.name} ({city.cp}).</p>
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

        {/* Maillage interne - Autres villes */}
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

        {/* Liens internes enrichis */}
        <div className="mt-8 glass-card p-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">Liens utiles</h3>
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <Link to="/products" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-primary" /> Catalogue produits
            </Link>
            <Link to="/impression-numerique" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-primary" /> Impression numérique
            </Link>
            <Link to="/grand-format" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-primary" /> Impression grand format
            </Link>
            <Link to="/supports-publicitaires" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-primary" /> Supports publicitaires
            </Link>
            <Link to="/personnalisation" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-primary" /> Personnalisation textile & objets
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

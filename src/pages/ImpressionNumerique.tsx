import { Link } from "react-router-dom";
import { ArrowRight, Phone, Mail, FileText, Printer, CheckCircle, Layers, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import imgService from "@/assets/services/impression-numerique.jpg";
import imgCartes from "@/assets/services/impression-cartes-visite.jpg";
import imgBrochures from "@/assets/services/impression-brochures.jpg";

export default function ImpressionNumerique() {
  useSEO({
    title: "Impression numérique en ligne – Flyers, cartes de visite, affiches | J2L Print",
    description: "Impression numérique professionnelle : flyers, cartes de visite, dépliants, affiches, brochures. Qualité offset et numérique, livraison rapide partout en France. Devis gratuit.",
    ogType: "website",
  });

  return (
    <section className="py-12">
      <div className="container max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Accueil</Link>
          <span>/</span>
          <span className="text-foreground">Impression numérique</span>
        </nav>

        {/* Hero */}
        <div className="glass-card overflow-hidden mb-8">
          <div className="h-48 md:h-64 overflow-hidden">
            <img src={imgService} alt="Atelier d'impression numérique J2L Print" className="w-full h-full object-cover" />
          </div>
          <div className="p-6 md:p-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Impression numérique professionnelle en ligne
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              <strong>J2L Print</strong> vous propose un service d'impression numérique haut de gamme pour tous vos supports de communication. 
              De la carte de visite au dépliant grand tirage, nous imprimons vos documents avec une qualité irréprochable 
              et une livraison rapide partout en France.
            </p>
          </div>
        </div>

        {/* Produits */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {[
            { icon: FileText, title: "Cartes de visite", desc: "Formats standard et personnalisés, papiers premium (couché, texturé, mat, brillant), finitions luxe." },
            { icon: Printer, title: "Flyers & dépliants", desc: "A5, A4, DL, formats spéciaux. Impression recto-verso, plis roulés, accordéon, fenêtre." },
            { icon: Layers, title: "Affiches & posters", desc: "De A3 à B0, papier couché ou photo. Idéal pour vitrine, événement ou décoration." },
            { icon: FileText, title: "Brochures & catalogues", desc: "Piqûre à cheval, dos carré collé, reliure spirale. Jusqu'à 200 pages." },
            { icon: CheckCircle, title: "Papeterie entreprise", desc: "Têtes de lettre, enveloppes, chemises à rabats, blocs-notes personnalisés." },
            { icon: Printer, title: "Faire-part & invitations", desc: "Mariages, naissances, événements. Papiers texturés, dorure à chaud, découpe laser." },
          ].map((item) => (
            <div key={item.title} className="glass-card p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-3">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Galerie visuelle */}
        <div className="grid gap-4 sm:grid-cols-2 mb-10">
          <div className="glass-card overflow-hidden">
            <img src={imgCartes} alt="Impression de cartes de visite et flyers professionnels" className="w-full h-48 object-cover" loading="lazy" width={1280} height={720} />
            <div className="p-4">
              <h3 className="font-display text-sm font-semibold text-foreground">Cartes de visite & flyers</h3>
              <p className="text-xs text-muted-foreground mt-1">Impression HD sur papiers premium, finitions luxe disponibles.</p>
            </div>
          </div>
          <div className="glass-card overflow-hidden">
            <img src={imgBrochures} alt="Brochures et catalogues imprimés" className="w-full h-48 object-cover" loading="lazy" width={1280} height={720} />
            <div className="p-4">
              <h3 className="font-display text-sm font-semibold text-foreground">Brochures & catalogues</h3>
              <p className="text-xs text-muted-foreground mt-1">Piqûre à cheval, dos carré collé, reliure spirale jusqu'à 200 pages.</p>
            </div>
          </div>
        </div>

        {/* Avantages */}
        <div className="glass-card p-6 mb-8 space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground">
            Pourquoi choisir J2L Print pour votre impression numérique ?
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              Notre atelier d'impression numérique utilise des <strong>presses de dernière génération</strong> garantissant 
              une fidélité des couleurs exceptionnelle et une résolution jusqu'à 2400 dpi. Que vous ayez besoin de 50 ou 
              50 000 exemplaires, nous adaptons le procédé (numérique ou offset) pour vous offrir le meilleur rapport qualité-prix.
            </p>
            <p>
              Chaque commande bénéficie d'un <strong>contrôle qualité automatique</strong> de vos fichiers : vérification 
              de la résolution, des fonds perdus, de la colorimétrie CMJN et des zones de sécurité. Notre équipe de 
              prépresse intervient si nécessaire pour garantir un résultat parfait.
            </p>
          </div>

          <h3 className="font-display text-lg font-semibold text-foreground pt-2">
            Nos engagements qualité
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
            {[
              "Impression HD jusqu'à 2400 dpi",
              "Papiers certifiés FSC & PEFC",
              "Vérification automatique des fichiers",
              "Livraison en 3-5 jours ouvrés",
              "Devis gratuit sous 24h",
              "Conception de maquettes dès 65 € HT",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Procédés */}
        <div className="glass-card p-6 mb-8 space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground">
            Impression numérique vs offset : quel procédé choisir ?
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 text-sm text-muted-foreground">
            <div className="space-y-2">
              <h3 className="font-display text-base font-semibold text-foreground">Impression numérique</h3>
              <p>Idéale pour les <strong>petites et moyennes séries</strong> (de 1 à 5 000 ex.). Mise en route rapide, pas de frais de plaque, personnalisation possible (données variables).</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-base font-semibold text-foreground">Impression offset</h3>
              <p>Recommandée pour les <strong>grands tirages</strong> (5 000+ ex.). Coût unitaire dégressif, rendu exceptionnel, large choix de papiers et finitions spéciales.</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Vous hésitez ? <Link to="/#devis" className="text-primary hover:underline">Demandez un devis gratuit</Link> et 
            notre équipe vous conseillera le meilleur procédé pour votre projet.
          </p>
        </div>

        {/* CTA */}
        <div className="glass-card p-6 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Prêt à lancer votre impression ?
            </h3>
            <p className="text-sm text-muted-foreground">Commandez en ligne ou demandez un devis personnalisé.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full">
              <Link to="/products">
                Voir le catalogue <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/#devis">
                Demander un devis <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Contact */}
        <div className="glass-card p-6 mb-10">
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            Besoin d'un conseil en impression ?
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <a href="tel:+33329304479" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
              <Phone className="h-4 w-4 text-primary" /> 03 29 30 44 79
            </a>
            <a href="mailto:contact@j2lpublicite.fr" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
              <Mail className="h-4 w-4 text-primary" /> contact@j2lpublicite.fr
            </a>
          </div>
        </div>

        {/* Maillage villes */}
        <div className="glass-card p-5 mb-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">Impression numérique par ville</h3>
          <div className="grid gap-1.5 sm:grid-cols-4 text-xs text-muted-foreground">
            {["epinal", "nancy", "metz", "strasbourg", "paris", "lyon", "marseille", "lille"].map((slug) => (
              <Link key={slug} to={`/imprimerie/${slug}`} className="hover:text-primary transition-colors flex items-center gap-1">
                <MapPin className="h-3 w-3 text-primary" /> Imprimerie {slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ")}
              </Link>
            ))}
          </div>
        </div>

        {/* Liens internes */}
        <div className="glass-card p-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">Nos autres services</h3>
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <Link to="/grand-format" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-primary" /> Impression grand format
            </Link>
            <Link to="/supports-publicitaires" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-primary" /> Supports publicitaires
            </Link>
            <Link to="/personnalisation" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-primary" /> Personnalisation textile & objets
            </Link>
            <Link to="/livraison" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-primary" /> Informations livraison
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

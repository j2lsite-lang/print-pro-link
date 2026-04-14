import { Link } from "react-router-dom";
import { ArrowRight, Phone, Mail, Layers, CheckCircle, Flag, Tent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import imgService from "@/assets/services/supports-publicitaires.jpg";

export default function SupportsPublicitaires() {
  useSEO({
    title: "Supports publicitaires – Roll-ups, totems, PLV, signalétique | J2L Print",
    description: "Supports publicitaires professionnels : roll-ups, totems, PLV, comptoirs, signalétique intérieure et extérieure. Idéal salons, événements, points de vente. Livraison France.",
    ogType: "website",
  });

  return (
    <section className="py-12">
      <div className="container max-w-4xl">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Accueil</Link>
          <span>/</span>
          <span className="text-foreground">Supports publicitaires</span>
        </nav>

        <div className="glass-card overflow-hidden mb-8">
          <div className="h-48 md:h-64 overflow-hidden">
            <img src={imgService} alt="Supports publicitaires J2L Print - roll-ups, totems, PLV" className="w-full h-full object-cover" />
          </div>
          <div className="p-6 md:p-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Supports publicitaires & signalétique
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              <strong>J2L Print</strong> conçoit et produit tous vos supports publicitaires pour salons professionnels, 
              événements, points de vente et espaces d'accueil. Roll-ups, totems, PLV, comptoirs, drapeaux, 
              tentes personnalisées — nous couvrons tous vos besoins de communication visuelle.
            </p>
          </div>
        </div>

        {/* Produits */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {[
            { icon: Layers, title: "Roll-ups & enrouleurs", desc: "Structures légères et transportables. Impression HD, changement de visuel possible. De 60 à 200 cm de large." },
            { icon: Flag, title: "Drapeaux & oriflammes", desc: "Beach flags, voiles, flammes. Impression sublimation recto-verso. Résistants au vent et aux intempéries." },
            { icon: Tent, title: "Tentes & barnums", desc: "Tentes pliantes personnalisées 3x3, 3x4.5, 3x6. Structure aluminium, impression toile complète." },
            { icon: Layers, title: "Totems & colonnes", desc: "Totems elliptiques, carrés, triangulaires. Éclairés ou non. Impressionnants et visibles de loin." },
            { icon: Flag, title: "Comptoirs d'accueil", desc: "Comptoirs pliables avec impression graphique. Idéal pour accueil salon, inscription événement." },
            { icon: Layers, title: "PLV & présentoirs", desc: "Chevalets, porte-brochures, displays carton, kakémonos. Mise en valeur de vos produits en magasin." },
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

        {/* Contenu SEO */}
        <div className="glass-card p-6 mb-8 space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground">
            Des supports publicitaires pour chaque occasion
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              Que ce soit pour un <strong>salon professionnel</strong>, une <strong>foire commerciale</strong>, 
              un <strong>événement sportif</strong> ou l'aménagement de votre <strong>point de vente</strong>, 
              nos supports publicitaires sont conçus pour maximiser votre visibilité.
            </p>
            <p>
              Tous nos produits sont <strong>personnalisables à vos couleurs</strong> et livrés prêts à l'emploi. 
              Les structures sont réutilisables : vous pouvez commander uniquement de nouveaux visuels pour 
              vos prochains événements, ce qui réduit considérablement le coût à long terme.
            </p>
          </div>

          <h3 className="font-display text-lg font-semibold text-foreground pt-2">
            Avantages de nos supports
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
            {[
              "Montage rapide sans outils",
              "Transport facile (housses incluses)",
              "Structures réutilisables",
              "Visuels interchangeables",
              "Impression haute définition",
              "Finitions professionnelles",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Cas d'usage */}
        <div className="glass-card p-6 mb-8 space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground">
            Exemples d'utilisation
          </h2>
          <div className="grid gap-4 sm:grid-cols-3 text-sm text-muted-foreground">
            <div className="space-y-2">
              <h3 className="font-display text-base font-semibold text-foreground">Salons & foires</h3>
              <p>Stand complet : roll-ups, comptoir, drapeaux, moquette imprimée. Pack salon sur devis.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-base font-semibold text-foreground">Points de vente</h3>
              <p>PLV, totems, chevalets, vitrophanies. Attirez l'attention sur vos promotions et nouveautés.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-base font-semibold text-foreground">Événements</h3>
              <p>Tentes personnalisées, beach flags, banderoles. Soyez visible de loin lors de vos événements.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="glass-card p-6 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Besoin de supports pour votre prochain événement ?
            </h3>
            <p className="text-sm text-muted-foreground">Devis gratuit, conseil personnalisé.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full">
              <Link to="/products">Voir le catalogue <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/#devis">Demander un devis <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>

        {/* Contact */}
        <div className="glass-card p-6 mb-10">
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">Contactez-nous</h2>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <a href="tel:+33329304479" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
              <Phone className="h-4 w-4 text-primary" /> 03 29 30 44 79
            </a>
            <a href="mailto:contact@j2lpublicite.fr" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
              <Mail className="h-4 w-4 text-primary" /> contact@j2lpublicite.fr
            </a>
          </div>
        </div>

        {/* Liens internes */}
        <div className="glass-card p-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">Nos autres services</h3>
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <Link to="/impression-numerique" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-primary" /> Impression numérique
            </Link>
            <Link to="/grand-format" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-primary" /> Impression grand format
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

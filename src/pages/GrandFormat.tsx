import { Link } from "react-router-dom";
import { ArrowRight, Phone, Mail, Image, Ruler, CheckCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import imgService from "@/assets/services/grand-format.jpg";
import imgBache from "@/assets/services/grand-format-bache.jpg";

export default function GrandFormat() {
  useSEO({
    title: "Impression grand format – Bâches, banderoles, adhésifs, kakémonos | J2L Print",
    description: "Impression grand format professionnelle : bâches, banderoles, adhésifs, kakémonos, enseignes. Haute résolution 1440 dpi, livraison rapide partout en France. Devis gratuit.",
    ogType: "website",
  });

  return (
    <section className="py-12">
      <div className="container max-w-4xl">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Accueil</Link>
          <span>/</span>
          <span className="text-foreground">Grand format</span>
        </nav>

        <div className="glass-card overflow-hidden mb-8">
          <div className="h-48 md:h-64 overflow-hidden">
            <img src={imgService} alt="Impression grand format J2L Print - imprimante grand format" className="w-full h-full object-cover" />
          </div>
          <div className="p-6 md:p-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Impression grand format en ligne
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              <strong>J2L Print</strong> réalise tous vos supports de communication grand format : bâches publicitaires, 
              banderoles, adhésifs, kakémonos et enseignes. Impression haute résolution jusqu'à 1440 dpi 
              sur tous types de supports, livrée partout en France.
            </p>
          </div>
        </div>

        {/* Produits */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {[
            { icon: Image, title: "Bâches publicitaires", desc: "PVC 500g/m², micro-perforées, mesh. Finitions œillets, ourlets, fourreau. Toutes dimensions." },
            { icon: Ruler, title: "Banderoles & calicots", desc: "Impression recto ou recto-verso. Idéal pour façades, événements sportifs et culturels." },
            { icon: Shield, title: "Adhésifs & vinyles", desc: "Sol, vitrine, véhicule, mur. Vinyles polymères longue durée, laminés anti-UV et anti-rayures." },
            { icon: Image, title: "Kakémonos & roll-ups", desc: "Structures auto-enroulantes, kakémonos suspendus. Transport facile, montage en 30 secondes." },
            { icon: Ruler, title: "Enseignes & panneaux", desc: "Dibond, PVC expansé, Akilux, plexiglas. Découpe sur mesure, pose possible sur devis." },
            { icon: Shield, title: "Décoration murale", desc: "Papier peint personnalisé, toiles tendues, panneaux acoustiques imprimés. Pour bureaux et commerces." },
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
            Pourquoi choisir J2L Print pour vos impressions grand format ?
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              Notre parc d'<strong>imprimantes grand format dernière génération</strong> (Roland, Mimaki) permet 
              d'imprimer sur des largeurs allant jusqu'à 3,20 mètres avec une résolution de 1440 dpi. 
              Les encres utilisées (éco-solvant, latex, UV) garantissent une <strong>tenue extérieure de 3 à 7 ans</strong> 
              selon le support.
            </p>
            <p>
              Chaque impression est soumise à un <strong>profil ICC calibré</strong> pour une fidélité couleur optimale. 
              Nous proposons également la découpe numérique (plotter de découpe Summa) pour des formes personnalisées : 
              lettres découpées, logos, stickers de forme.
            </p>
          </div>

          <h3 className="font-display text-lg font-semibold text-foreground pt-2">
            Supports et finitions disponibles
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
            {[
              "Bâche PVC 500g, 340g ou mesh",
              "Vinyle adhésif polymère ou monomère",
              "Dibond (aluminium composite)",
              "PVC expansé (Forex) 3 à 10 mm",
              "Akilux (polypropylène alvéolaire)",
              "Plexiglas & polycarbonate",
              "Papier peint intissé 170g",
              "Toile canvas coton ou polyester",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Applications */}
        <div className="glass-card p-6 mb-8 space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground">
            Pour quels usages ?
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 text-sm text-muted-foreground">
            <div className="space-y-2">
              <h3 className="font-display text-base font-semibold text-foreground">Communication extérieure</h3>
              <p>Façades de magasins, chantiers, événements sportifs, festivals. Nos supports résistent aux intempéries et aux UV.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-base font-semibold text-foreground">Aménagement intérieur</h3>
              <p>Bureaux, showrooms, restaurants, hôtels. Décoration murale, signalétique directionnelle, cloisons imprimées.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="glass-card p-6 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Un projet grand format ?
            </h3>
            <p className="text-sm text-muted-foreground">Devis gratuit sous 24h, livraison rapide.</p>
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

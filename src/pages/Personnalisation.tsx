import { Link } from "react-router-dom";
import { ArrowRight, Phone, Mail, Printer, CheckCircle, Shirt, Coffee, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import imgService from "@/assets/services/personnalisation.jpg";
import imgObjets from "@/assets/services/personnalisation-objets.jpg";

export default function Personnalisation() {
  useSEO({
    title: "Personnalisation textile & objets publicitaires – T-shirts, mugs, goodies | J2L Print",
    description: "Personnalisation textile et objets publicitaires : t-shirts, polos, sweats, mugs, stylos, clés USB, goodies. Marquage sérigraphie, broderie, transfert. Livraison France.",
    ogType: "website",
  });

  return (
    <section className="py-12">
      <div className="container max-w-4xl">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Accueil</Link>
          <span>/</span>
          <span className="text-foreground">Personnalisation</span>
        </nav>

        <div className="glass-card overflow-hidden mb-8">
          <div className="h-48 md:h-64 overflow-hidden">
            <img src={imgService} alt="Personnalisation textile et objets publicitaires J2L Print" className="w-full h-full object-cover" />
          </div>
          <div className="p-6 md:p-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Personnalisation textile & objets publicitaires
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              <strong>J2L Print</strong> personnalise vos textiles et objets publicitaires à l'image de votre entreprise. 
              T-shirts, polos, sweats, vestes, mugs, stylos, clés USB, sacs, carnets — des milliers de produits 
              personnalisables pour vos équipes, clients et événements.
            </p>
          </div>
        </div>

        {/* Produits */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {[
            { icon: Shirt, title: "T-shirts & polos", desc: "Coton bio, polyester technique, coupe homme/femme/enfant. Marquage sérigraphie, transfert ou DTF." },
            { icon: Shirt, title: "Sweats & vestes", desc: "Sweats zippés, hoodies, softshells, polaires. Broderie ou impression, petites et grandes séries." },
            { icon: Coffee, title: "Mugs & thermos", desc: "Mugs céramique, thermos inox, gourdes. Impression sublimation haute qualité, lavable en machine." },
            { icon: Printer, title: "Stylos & papeterie", desc: "Stylos bille, roller, feutres. Carnets, bloc-notes, agendas personnalisés à votre logo." },
            { icon: Coffee, title: "Sacs & bagagerie", desc: "Tote bags, sacs shopping, sacoches, valises. Impression sérigraphie ou numérique directe." },
            { icon: Printer, title: "High-tech & USB", desc: "Clés USB, batteries externes, enceintes, supports téléphone. Gravure laser ou impression." },
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

        {/* Visuel objets */}
        <div className="glass-card overflow-hidden mb-10">
          <img src={imgObjets} alt="Objets publicitaires personnalisés : t-shirts, mugs, goodies" className="w-full h-56 object-cover" loading="lazy" width={1280} height={720} />
          <div className="p-4">
            <h3 className="font-display text-base font-semibold text-foreground">Vos goodies sur mesure</h3>
            <p className="text-sm text-muted-foreground mt-1">T-shirts, mugs, stylos, sacs — tout personnalisé à votre image pour vos équipes et clients.</p>
          </div>
        </div>

        {/* Techniques */}
        <div className="glass-card p-6 mb-8 space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground">
            Nos techniques de marquage
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 text-sm text-muted-foreground">
            <div className="space-y-2">
              <h3 className="font-display text-base font-semibold text-foreground">Sérigraphie</h3>
              <p>Idéale pour les <strong>grandes séries</strong>. Encres opaques, résistantes au lavage. 
              Rendu intense et durable sur textile et objets.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-base font-semibold text-foreground">Broderie</h3>
              <p>Marquage <strong>haut de gamme</strong> pour polos, chemises, casquettes. 
              Fils polyester multi-coloris, rendu premium et résistant.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-base font-semibold text-foreground">Transfert DTF / numérique</h3>
              <p>Impression <strong>full color</strong> photo-réaliste. Idéal petites séries et designs complexes. 
              Souple au toucher, excellente tenue au lavage.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-base font-semibold text-foreground">Sublimation</h3>
              <p>Pour objets (mugs, coques, puzzles) et textiles polyester. 
              Impression <strong>bord à bord</strong>, couleurs vives et permanentes.</p>
            </div>
          </div>
        </div>

        {/* Avantages */}
        <div className="glass-card p-6 mb-8 space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground">
            Pourquoi personnaliser avec J2L Print ?
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
            {[
              "Catalogue de + de 5 000 produits",
              "Marquage multi-techniques",
              "Petites séries dès 10 pièces",
              "Maquette gratuite avant production",
              "Livraison rapide en 5-7 jours",
              "Devis gratuit sous 24h",
              "Échantillons sur demande",
              "Accompagnement personnalisé",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="glass-card p-6 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Un projet de personnalisation ?
            </h3>
            <p className="text-sm text-muted-foreground">Envoyez-nous votre logo, on s'occupe du reste.</p>
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
            <a href="mailto:contact@j2lprint.fr" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
              <Mail className="h-4 w-4 text-primary" /> contact@j2lprint.fr
            </a>
          </div>
        </div>

        {/* Maillage villes */}
        <div className="glass-card p-5 mb-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">Personnalisation par ville</h3>
          <div className="grid gap-1.5 sm:grid-cols-4 text-xs text-muted-foreground">
            {["epinal", "nancy", "metz", "strasbourg", "paris", "lyon", "nice", "bordeaux"].map((slug) => (
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
            <Link to="/impression-numerique" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-primary" /> Impression numérique
            </Link>
            <Link to="/grand-format" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-primary" /> Impression grand format
            </Link>
            <Link to="/supports-publicitaires" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-primary" /> Supports publicitaires
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

import { Link } from "react-router-dom";
import { Facebook, ExternalLink, MapPin } from "lucide-react";
import logoJ2L from "@/assets/logo-j2l.png";

// Only published cities with a real, indexable /ville/{slug} page.
const cityLinks = [
  { slug: "epinal", name: "Épinal" },
  { slug: "nancy", name: "Nancy" },
  { slug: "metz", name: "Metz" },
  { slug: "strasbourg", name: "Strasbourg" },
  { slug: "mulhouse", name: "Mulhouse" },
  { slug: "reims", name: "Reims" },
  { slug: "troyes", name: "Troyes" },
  { slug: "colmar", name: "Colmar" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-[1.2fr_.8fr_.8fr_.8fr] items-start">
          {/* Brand + Address */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logoJ2L} alt="J2L Print" className="h-9 w-9 rounded-xl object-contain bg-primary/10 p-0.5" />
              <span className="font-display text-base font-bold text-foreground">J2L Print</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Votre imprimerie en ligne dans toute la France. Impression numérique, supports publicitaires, objets personnalisés.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              22 B rue Robert Barret, 88390 Uxegney
            </p>
            <p className="text-sm text-muted-foreground">
              Tél : <a href="tel:+33329304479" className="text-foreground hover:text-primary transition-colors">03 29 30 44 79</a>
            </p>
            <p className="text-sm text-muted-foreground">
              Email : <a href="mailto:contact@j2lprint.fr" className="text-foreground hover:text-primary transition-colors">contact@j2lprint.fr</a>
            </p>

            {/* Liens externes */}
            <div className="flex items-center gap-3 mt-4">
              <a
                href="https://www.facebook.com/J2lPublicite"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook J2L Publicité"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://www.j2ltextiles.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" /> J2L Textiles
              </a>
              <a
                href="https://www.j2lpublicite.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" /> J2L Publicité
              </a>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              © {new Date().getFullYear()} J2L Print (J2L Publicité). Tous droits réservés.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground mb-3">Navigation</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/products" className="hover:text-foreground transition-colors">Catalogue</Link>
              <Link to="/impression-numerique" className="hover:text-foreground transition-colors">Impression numérique</Link>
              <Link to="/grand-format" className="hover:text-foreground transition-colors">Grand format</Link>
              <Link to="/supports-publicitaires" className="hover:text-foreground transition-colors">Supports publicitaires</Link>
              <Link to="/personnalisation" className="hover:text-foreground transition-colors">Personnalisation</Link>
              <Link to="/#devis" className="hover:text-foreground transition-colors">Devis gratuit</Link>
              <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
              <Link to="/livraison" className="hover:text-foreground transition-colors">Livraison</Link>
            </nav>
          </div>

          {/* Legal + Cities */}
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground mb-3">Informations</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/mentions-legales" className="hover:text-foreground transition-colors">Mentions légales</Link>
              <Link to="/cgv" className="hover:text-foreground transition-colors">CGV</Link>
              <Link to="/politique-retours" className="hover:text-foreground transition-colors">Politique de retours</Link>
              <Link to="/politique-confidentialite" className="hover:text-foreground transition-colors">Confidentialité</Link>
            </nav>

            <h4 className="font-display text-sm font-semibold text-foreground mt-5 mb-3">Nos villes</h4>
            <nav className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              {cityLinks.map((c) => (
                <Link key={c.slug} to={`/ville/${c.slug}`} className="hover:text-foreground transition-colors flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary" /> {c.name}
                </Link>
              ))}
              <Link to="/imprimerie" className="text-primary hover:text-foreground transition-colors text-xs mt-1">
                Voir nos villes desservies →
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { Link } from "react-router-dom";
import logoJ2L from "@/assets/logo-j2l.png";

const cityLinks = [
  { slug: "epinal", name: "Épinal" },
  { slug: "nancy", name: "Nancy" },
  { slug: "metz", name: "Metz" },
  { slug: "strasbourg", name: "Strasbourg" },
  { slug: "paris", name: "Paris" },
  { slug: "lyon", name: "Lyon" },
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
              Email : <a href="mailto:contact@j2lpublicite.fr" className="text-foreground hover:text-primary transition-colors">contact@j2lpublicite.fr</a>
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              © {new Date().getFullYear()} J2L Print (J2L Publicité). Tous droits réservés.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground mb-3">Navigation</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/products" className="hover:text-foreground transition-colors">Catalogue</Link>
              <Link to="/#services" className="hover:text-foreground transition-colors">Services</Link>
              <Link to="/#devis" className="hover:text-foreground transition-colors">Devis gratuit</Link>
              <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
              <Link to="/livraison" className="hover:text-foreground transition-colors">Livraison</Link>
              <Link to="/imprimerie" className="hover:text-foreground transition-colors">Nos villes</Link>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground mb-3">Informations</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/mentions-legales" className="hover:text-foreground transition-colors">Mentions légales</Link>
              <Link to="/cgv" className="hover:text-foreground transition-colors">CGV</Link>
              <Link to="/politique-retours" className="hover:text-foreground transition-colors">Politique de retours</Link>
              <Link to="/politique-confidentialite" className="hover:text-foreground transition-colors">Confidentialité</Link>
            </nav>
          </div>

          {/* Villes */}
          <div>
            {/* SEO: imprimerie en ligne par ville */}
            <h4 className="font-display text-sm font-semibold text-foreground mb-3">Nos villes</h4>
            <nav aria-label="Imprimerie en ligne par ville" className="flex flex-col gap-2 text-sm text-muted-foreground">
              {cityLinks.map((c) => (
                <Link key={c.slug} to={`/imprimerie/${c.slug}`} className="hover:text-foreground transition-colors">
                  Imprimerie {c.name}
                </Link>
              ))}
              <Link to="/imprimerie" className="text-primary hover:underline text-xs mt-1">
                Toutes les villes →
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
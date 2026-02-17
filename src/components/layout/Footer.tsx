import { Link } from "react-router-dom";
import logoJ2L from "@/assets/logo-j2l.png";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-[1.2fr_.8fr_.8fr] items-start">
          {/* Brand + Address */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logoJ2L} alt="J2L Print" className="h-9 w-9 rounded-xl object-cover" />
              <span className="font-display text-base font-bold text-foreground">J2L Print</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              22 B rue Robert Barret, 88390 Uxegney, France
            </p>
            <p className="text-sm text-muted-foreground">
              Téléphone : <a href="tel:+33329304479" className="text-foreground hover:text-primary transition-colors">03 29 30 44 79</a>
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              © {new Date().getFullYear()} J2L Print. Tous droits réservés.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground mb-3">Navigation</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/products" className="hover:text-foreground transition-colors">Catalogue</Link>
              <Link to="/#services" className="hover:text-foreground transition-colors">Services</Link>
              <Link to="/#devis" className="hover:text-foreground transition-colors">Devis</Link>
              <Link to="/#contact" className="hover:text-foreground transition-colors">Contact</Link>
              <Link to="/#faq" className="hover:text-foreground transition-colors">FAQ</Link>
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
        </div>
      </div>
    </footer>
  );
}

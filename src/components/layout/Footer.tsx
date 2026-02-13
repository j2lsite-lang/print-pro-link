import { Printer } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-[1.2fr_.8fr] items-start">
          {/* Left */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-card">
                <Printer className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display text-base font-bold text-foreground">J2L Print</span>
                <span className="block text-xs text-muted-foreground">Marque J2L Publicité</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              22 B rue Robert Barret, 88390 Uxegney, France
            </p>
            <p className="text-sm text-muted-foreground">
              Téléphone : <a href="tel:+33329304479" className="text-foreground hover:text-primary transition-colors">03 29 30 44 79</a>
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              © {new Date().getFullYear()} J2L Print — Marque J2L Publicité.
            </p>
          </div>

          {/* Right */}
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground mb-3">Liens</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/products" className="hover:text-foreground transition-colors">Catalogue</Link>
              <Link to="/#services" className="hover:text-foreground transition-colors">Services</Link>
              <Link to="/#devis" className="hover:text-foreground transition-colors">Devis</Link>
              <Link to="/#contact" className="hover:text-foreground transition-colors">Contact</Link>
              <Link to="/#faq" className="hover:text-foreground transition-colors">FAQ</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}

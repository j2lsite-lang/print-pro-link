import { Package } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-10">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">
              J2L <span className="text-accent">Publicité</span>
            </span>
          </div>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/products" className="hover:text-foreground">Catalogue</Link>
            <Link to="/cart" className="hover:text-foreground">Panier</Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} J2L Publicité. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

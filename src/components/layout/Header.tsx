import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Menu, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            J2L <span className="text-accent">Publicité</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/products" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Catalogue
          </Link>
          <Link to="/cart" className="relative">
            <ShoppingCart className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                {itemCount}
              </span>
            )}
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/account/orders" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Mes commandes
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut}>
                Déconnexion
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => navigate("/auth")}>
              <User className="mr-1.5 h-4 w-4" />
              Connexion
            </Button>
          )}
        </nav>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-card p-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link to="/products" onClick={() => setMobileOpen(false)} className="text-sm font-medium">Catalogue</Link>
            <Link to="/cart" onClick={() => setMobileOpen(false)} className="text-sm font-medium">Panier ({itemCount})</Link>
            {user ? (
              <>
                <Link to="/account/orders" onClick={() => setMobileOpen(false)} className="text-sm font-medium">Mes commandes</Link>
                <Button variant="ghost" size="sm" onClick={() => { signOut(); setMobileOpen(false); }}>Déconnexion</Button>
              </>
            ) : (
              <Button size="sm" onClick={() => { navigate("/auth"); setMobileOpen(false); }}>Connexion</Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

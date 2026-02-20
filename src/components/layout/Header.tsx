import { Link } from "react-router-dom";
import { ShoppingCart, Menu, X, Phone } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import logoJ2L from "@/assets/logo-j2l.png";

const navLinks = [
  { to: "/products", label: "Catalogue" },
  { to: "/#services", label: "Services" },
  { to: "/#devis", label: "Devis" },
  { to: "/#contact", label: "Contact" },
  { to: "/blog", label: "Blog" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/82 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 min-w-[160px]">
          <img src={logoJ2L} alt="J2L Print" className="h-10 w-10 rounded-xl object-cover" />
          <span className="font-display text-base font-bold tracking-wide text-foreground">
            J2L Print
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 md:flex flex-wrap justify-end">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="pill text-sm text-foreground/90">
              {l.label}
            </Link>
          ))}
          <Link to="/cart" className="pill relative">
            <ShoppingCart className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-callback'));
            }}
            className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:brightness-95"
          >
            <Phone className="h-4 w-4" />
            Rappelez-moi
          </button>
        </nav>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background p-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="pill text-sm">
                {l.label}
              </Link>
            ))}
            <Link to="/cart" onClick={() => setMobileOpen(false)} className="pill text-sm">
              Panier ({itemCount})
            </Link>
            <button
              onClick={() => {
                setMobileOpen(false);
                window.dispatchEvent(new CustomEvent('open-callback'));
              }}
              className="pill text-sm text-left font-semibold"
            >
              <Phone className="h-4 w-4 mr-1" /> Rappelez-moi
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

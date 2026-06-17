import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X, Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/hooks/useCart";
import { getCatalogProducts } from "@/lib/printcom";
import { searchProducts } from "@/lib/search";
import { isExcludedSku } from "@/config/excluded-products";
import logoJ2L from "@/assets/logo-j2l.png";

const navLinks = [
  { to: "/products", label: "Catalogue" },
  { to: "/#services", label: "Services" },
  { to: "/#devis", label: "Devis" },
  { to: "/blog", label: "Blog" },
];

interface QuickProduct {
  id: string;
  name: string;
}

let cachedProducts: QuickProduct[] | null = null;

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleHashLink = (e: React.MouseEvent, to: string) => {
    const [path, hash] = to.split("#");
    if (hash && (location.pathname === "/" || location.pathname === path)) {
      e.preventDefault();
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QuickProduct[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [allProducts, setAllProducts] = useState<QuickProduct[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cachedProducts) {
      setAllProducts(cachedProducts);
      return;
    }

    getCatalogProducts()
      .then((items) => {
        cachedProducts = items
          .filter((p) => !isExcludedSku(p.sku))
          .map((p) => ({
            id: p.sku,
            name: p.name,
          }));
        setAllProducts(cachedProducts);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const matched = searchProducts(
      allProducts.map((p) => ({ sku: p.id, name: p.name })),
      query,
      8,
    ).map((p) => ({ id: p.sku, name: p.name }));
    setResults(matched);
  }, [query, allProducts]);


  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/products?q=${encodeURIComponent(query.trim())}`);
      setShowResults(false);
      setQuery("");
    }
  };

  const goToProduct = (id: string) => {
    navigate(`/products/${id}`);
    setShowResults(false);
    setQuery("");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/82 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img src={logoJ2L} alt="J2L Print" className="h-10 w-10 rounded-xl object-contain bg-primary/10 p-0.5" />
          <span className="font-display text-base font-bold tracking-wide text-foreground hidden sm:inline">
            J2L Print
          </span>
        </Link>

        <div ref={searchRef} className="relative hidden md:block flex-1 max-w-md mx-4">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un produit… flyers, affiches, bâches, autocollants"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                className="w-full rounded-full border border-border bg-muted/50 py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </form>
          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-background shadow-elevated z-50 overflow-hidden">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => goToProduct(p.id)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                    <Search className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-foreground truncate">{p.name}</span>
                </button>
              ))}
              <button
                onClick={handleSubmit as any}
                className="w-full px-4 py-2 text-xs text-primary font-medium border-t border-border hover:bg-muted/50 transition-colors"
              >
                Voir tous les résultats pour « {query} »
              </button>
            </div>
          )}
          {showResults && query.trim() && results.length === 0 && allProducts.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-background shadow-elevated z-50 p-4 text-sm">
              <p className="text-muted-foreground">Aucun produit trouvé pour « {query} ».</p>
              <p className="mt-2 text-xs text-muted-foreground">Suggestions : flyers, affiches, bâches, autocollants, cartes de visite.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to="/products" onClick={() => setShowResults(false)} className="pill text-xs font-medium">
                  Voir le catalogue
                </Link>
                <Link to="/#devis" onClick={() => setShowResults(false)} className="pill text-xs font-medium">
                  Demander un devis
                </Link>
              </div>
            </div>
          )}

        </div>

        <nav className="hidden items-center gap-1.5 md:flex flex-wrap justify-end shrink-0">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} onClick={(e) => handleHashLink(e, l.to)} className="pill px-3 py-1.5 text-[13px] text-foreground/90">
              {l.label}
            </Link>
          ))}
          <Link to="/cart" className="pill relative px-2.5 py-1.5">
            <ShoppingCart className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {itemCount}
              </span>
            )}
          </Link>
        </nav>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background p-4 md:hidden">
          <form onSubmit={(e) => {
            handleSubmit(e);
            setMobileOpen(false);
          }} className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un produit…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-full border border-border bg-muted/50 py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </form>
          <nav className="flex flex-col gap-2">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} onClick={(e) => {
                handleHashLink(e, l.to);
                setMobileOpen(false);
              }} className="pill text-sm">
                {l.label}
              </Link>
            ))}
            <Link to="/cart" onClick={() => setMobileOpen(false)} className="pill text-sm">
              Panier ({itemCount})
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

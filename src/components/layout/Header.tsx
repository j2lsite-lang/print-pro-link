import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, X, Phone, Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/hooks/useCart";
import { listProducts } from "@/lib/printcom";
import logoJ2L from "@/assets/logo-j2l.png";

const navLinks = [
  { to: "/products", label: "Catalogue" },
  { to: "/#services", label: "Services" },
  { to: "/#devis", label: "Devis" },
  { to: "/#contact", label: "Contact" },
  { to: "/blog", label: "Blog" },
];

interface QuickProduct {
  sku: string;
  titleSingle?: string;
  titlePlural?: string;
  thumbnailUrl?: string;
}

let cachedProducts: QuickProduct[] | null = null;

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QuickProduct[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [allProducts, setAllProducts] = useState<QuickProduct[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load products once for search
  useEffect(() => {
    if (cachedProducts) {
      setAllProducts(cachedProducts);
      return;
    }
    listProducts().then((data) => {
      const items: QuickProduct[] = Array.isArray(data) ? data : data?.products || data?.items || [];
      cachedProducts = items.filter((p: any) => p.active !== false);
      setAllProducts(cachedProducts);
    }).catch(() => {});
  }, []);

  // Filter on query change
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const matched = allProducts.filter((p) => {
      const title = (p.titleSingle || p.titlePlural || "").toLowerCase();
      return title.includes(q) || p.sku.toLowerCase().includes(q);
    }).slice(0, 8);
    setResults(matched);
  }, [query, allProducts]);

  // Close on outside click
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

  const goToProduct = (sku: string) => {
    navigate(`/products/${sku}`);
    setShowResults(false);
    setQuery("");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/82 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between gap-2">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img src={logoJ2L} alt="J2L Print" className="h-10 w-10 rounded-xl object-contain bg-primary/10 p-0.5" />
          <span className="font-display text-base font-bold tracking-wide text-foreground hidden sm:inline">
            J2L Print
          </span>
        </Link>

        {/* Search bar - desktop */}
        <div ref={searchRef} className="relative hidden md:block flex-1 max-w-md mx-4">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un produit… (tampons, flyers, bâches…)"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
                onFocus={() => setShowResults(true)}
                className="w-full rounded-full border border-border bg-muted/50 py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </form>
          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-background shadow-elevated z-50 overflow-hidden">
              {results.map((p) => (
                <button
                  key={p.sku}
                  onClick={() => goToProduct(p.sku)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
                >
                  {p.thumbnailUrl ? (
                    <img src={p.thumbnailUrl} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
                  ) : (
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                      <Search className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-sm text-foreground truncate">{p.titleSingle || p.sku}</span>
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
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-background shadow-elevated z-50 p-4 text-center text-sm text-muted-foreground">
              Aucun produit trouvé pour « {query} »
            </div>
          )}
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1.5 md:flex flex-wrap justify-end shrink-0">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="pill px-3 py-1.5 text-[13px] text-foreground/90">
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
          <a
            href="mailto:contact@j2lpublicite.fr"
            className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-[13px] font-semibold text-accent-foreground transition hover:brightness-95"
          >
            <Phone className="h-3.5 w-3.5" />
            Contactez-nous
          </a>
        </nav>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background p-4 md:hidden">
          {/* Mobile search */}
          <form onSubmit={(e) => { handleSubmit(e); setMobileOpen(false); }} className="mb-3">
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

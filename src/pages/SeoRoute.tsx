import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import pages from "@/seo/generated/pages.json";
import type { SeoPage } from "@/seo/types";
import NotFound from "@/pages/NotFound";

const PAGES = pages as unknown as Record<string, SeoPage>;

/**
 * Renders an SEO content page from the prerendered model so the runtime
 * React output matches the build-time prerendered HTML exactly (same H1,
 * breadcrumb, intro, links, JSON-LD) — no "Google vs user" divergence.
 */
export default function SeoRoute() {
  const { pathname } = useLocation();
  const page = PAGES[pathname] || PAGES[pathname.replace(/\/$/, "")];
  if (!page) return <NotFound />;

  return (
    <>
      <Seo
        title={page.title}
        description={page.description}
        path={page.path}
        ogType={page.ogType}
        noindex={page.noindex}
        jsonLd={page.jsonLd}
      />
      <article className="container max-w-4xl py-10 space-y-8">
        <nav aria-label="Fil d'Ariane" className="text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-2">
            {page.breadcrumb.map((b, i) => (
              <li key={b.path} className="flex items-center gap-2">
                {i === page.breadcrumb.length - 1 ? (
                  <span aria-current="page" className="text-foreground">{b.name}</span>
                ) : (
                  <Link to={b.path} className="hover:text-foreground">{b.name}</Link>
                )}
                {i < page.breadcrumb.length - 1 && <span aria-hidden>›</span>}
              </li>
            ))}
          </ol>
        </nav>

        <header className="space-y-4">
          <h1 className="text-3xl font-bold">{page.h1}</h1>
          {page.intro.map((p, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>
          ))}
        </header>

        {page.sections?.map((s, i) => (
          <section key={i} className="space-y-3">
            <h2 className="text-xl font-semibold">{s.heading}</h2>
            {s.paragraphs?.map((p, j) => (
              <p key={j} className="text-muted-foreground leading-relaxed">{p}</p>
            ))}
            {s.bullets && (
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                {s.bullets.map((b, j) => <li key={j}>{b}</li>)}
              </ul>
            )}
          </section>
        ))}

        {page.products && page.products.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{page.productsHeading || "Nos produits"}</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {page.products.map((p) => (
                <li key={p.sku}>
                  <Link
                    to={`/products/${p.sku}`}
                    className="group block rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-elevated"
                  >
                    {p.image && (
                      <div className="aspect-[4/3] mb-3 overflow-hidden rounded-lg bg-muted">
                        <img
                          src={p.image}
                          alt={p.name}
                          loading="lazy"
                          className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <h3 className="font-display text-sm font-semibold text-card-foreground transition-colors group-hover:text-primary">
                      {p.name}
                    </h3>
                    <span className="mt-1 block text-xs text-muted-foreground">Réf. {p.sku}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {page.faq && page.faq.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Questions fréquentes</h2>
            {page.faq.map((f, i) => (
              <details key={i} className="rounded-lg border border-border p-4">
                <summary className="cursor-pointer font-medium">{f.q}</summary>
                <p className="mt-2 text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </section>
        )}

        {page.internalLinks?.map((g, i) => (
          <section key={i} className="space-y-3">
            <h2 className="text-lg font-semibold">{g.heading}</h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {g.links.map((l) => (
                <li key={l.path}>
                  {l.external ? (
                    <a href={l.path} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{l.label}</a>
                  ) : (
                    <Link to={l.path} className="text-primary hover:underline">{l.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </article>
    </>
  );
}

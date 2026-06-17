import { useLocation, Link } from "react-router-dom";
import {
  FileText, CreditCard, Image as ImageIcon, Flag, Gift, Shirt,
  LayoutPanelTop, Sticker, ArrowRight, ExternalLink, type LucideIcon,
} from "lucide-react";
import Seo from "@/components/Seo";
import pages from "@/seo/generated/pages.json";
import type { SeoPage } from "@/seo/types";
import NotFound from "@/pages/NotFound";

const PAGES = pages as unknown as Record<string, SeoPage>;

const ICONS: Record<string, LucideIcon> = {
  FileText, CreditCard, Image: ImageIcon, Flag, Gift, Shirt,
  LayoutPanelTop, Sticker,
};

/**
 * Renders an SEO content page from the prerendered model so the runtime
 * React output matches the build-time prerendered HTML (same H1, breadcrumb,
 * intro, links, JSON-LD) while adding the full visual design (hero, cards).
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

      {/* Breadcrumb */}
      <div className="container max-w-5xl pt-6">
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
      </div>

      {/* Hero */}
      {page.hero ? (
        <header className="container max-w-5xl pt-4">
          <div className="relative overflow-hidden rounded-2xl border border-border shadow-elevated">
            <img
              src={page.hero.image}
              alt={page.hero.imageAlt}
              width={1280}
              height={720}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
            <div className="relative z-10 max-w-2xl px-6 py-12 sm:px-10 sm:py-16">
              {page.hero.eyebrow && (
                <p className="mb-3 inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
                  {page.hero.eyebrow}
                </p>
              )}
              <h1 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                {page.h1}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {page.hero.tagline}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                {page.hero.ctas.map((c) => (
                  <Link
                    key={c.path + c.label}
                    to={c.path}
                    className={
                      c.variant === "secondary"
                        ? "inline-flex items-center gap-2 rounded-xl border border-border bg-foreground/5 px-5 py-3 font-semibold text-foreground transition-colors hover:bg-foreground/10"
                        : "inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition-all hover:brightness-95"
                    }
                  >
                    {c.label} <ArrowRight className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </header>
      ) : (
        <header className="container max-w-5xl space-y-4 pt-4">
          <h1 className="font-display text-3xl font-bold">{page.h1}</h1>
        </header>
      )}

      <article className="container max-w-5xl space-y-10 py-10">
        {/* Intro */}
        <div className="space-y-4">
          {page.intro.map((p, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>
          ))}
        </div>

        {/* Sections */}
        {page.sections?.map((s, i) => (
          <section key={i} className="space-y-3">
            <h2 className="font-display text-2xl font-semibold">{s.heading}</h2>
            {s.paragraphs?.map((p, j) => (
              <p key={j} className="text-muted-foreground leading-relaxed">{p}</p>
            ))}
            {s.bullets && s.bullets.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {s.bullets.map((b, j) => <li key={j}>{b}</li>)}
              </ul>
            )}
          </section>
        ))}

        {/* Product grid */}
        {page.productGrid && (
          <section className="space-y-5">
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold">{page.productGrid.heading}</h2>
              {page.productGrid.intro && (
                <p className="text-muted-foreground">{page.productGrid.intro}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {page.productGrid.cards.map((c) => {
                const Icon = ICONS[c.icon] || FileText;
                return (
                  <Link
                    key={c.label}
                    to={c.path}
                    className="glass-card group block p-5 transition-all hover:shadow-elevated"
                  >
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-foreground">{c.label}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                      Configurer <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* CTA */}
        {page.cta && (
          <section className="flex flex-wrap gap-3">
            <Link
              to={page.cta.path}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:brightness-95"
            >
              {page.cta.label} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/#devis"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-foreground/5 px-6 py-3 font-semibold text-foreground transition-colors hover:bg-foreground/10"
            >
              Demander un devis
            </Link>
          </section>
        )}

        {/* FAQ */}
        {page.faq && page.faq.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display text-2xl font-semibold">Questions fréquentes</h2>
            {page.faq.map((f, i) => (
              <details key={i} className="rounded-lg border border-border p-4">
                <summary className="cursor-pointer font-medium">
                  <h3 className="inline font-display text-base font-medium">{f.q}</h3>
                </summary>
                <p className="mt-2 text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </section>
        )}

        {/* Internal links */}
        {page.internalLinks?.map((g, i) => (
          <section key={i} className="space-y-3">
            <h2 className="font-display text-lg font-semibold">{g.heading}</h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {g.links.map((l) => (
                <li key={l.path + l.label}>
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

        {/* External resources */}
        {page.externalLinks && page.externalLinks.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">Ressources officielles</h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {page.externalLinks.map((l) => (
                <li key={l.path}>
                  <a
                    href={l.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {l.label} <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

      </article>
    </>
  );
}

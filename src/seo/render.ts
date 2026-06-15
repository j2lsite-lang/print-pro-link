// Pure (no-React) HTML renderer for the SEO page model.
// Used by the build-time prerenderer to inject real content into the
// static HTML shell, and to build per-route <head>. Output must be valid,
// crawler-readable HTML present in "view source" without executing JS.

import type { SeoPage, LinkGroup } from "./types";

export const SITE_URL = "https://j2lprint.fr";
export const SITE_NAME = "J2L Print";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fullTitle(title: string): string {
  return title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
}

/** Build the <head> tag string for a page. */
export function renderHead(page: SeoPage): string {
  const t = esc(fullTitle(page.title));
  const d = esc(page.description);
  const canonical = `${SITE_URL}${page.path}`;
  const robots = page.noindex
    ? "noindex, follow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  const tags = [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:type" content="${page.ogType || "website"}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="fr_FR" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    ...page.jsonLd.map(
      (b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`,
    ),
  ];
  return tags.join("\n    ");
}

function renderBreadcrumb(items: SeoPage["breadcrumb"]): string {
  const lis = items
    .map((it, i) =>
      i === items.length - 1
        ? `<li aria-current="page">${esc(it.name)}</li>`
        : `<li><a href="${it.path}">${esc(it.name)}</a></li>`,
    )
    .join(" <span aria-hidden=\"true\">&rsaquo;</span> ");
  return `<nav aria-label="Fil d'Ariane" class="seo-breadcrumb"><ol>${lis}</ol></nav>`;
}

function renderLinkGroup(g: LinkGroup): string {
  const links = g.links
    .map((l) =>
      l.external
        ? `<li><a href="${l.path}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a></li>`
        : `<li><a href="${l.path}">${esc(l.label)}</a></li>`,
    )
    .join("");
  return `<section class="seo-links"><h2>${esc(g.heading)}</h2><ul>${links}</ul></section>`;
}

function renderSection(s: ContentSectionLike): string {
  const ps = (s.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join("");
  const bs = s.bullets && s.bullets.length
    ? `<ul>${s.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`
    : "";
  return `<section><h2>${esc(s.heading)}</h2>${ps}${bs}</section>`;
}
type ContentSectionLike = { heading: string; paragraphs?: string[]; bullets?: string[] };

function renderFaq(faq: SeoPage["faq"]): string {
  if (!faq || !faq.length) return "";
  const items = faq
    .map((f) => `<details><summary><h3>${esc(f.q)}</h3></summary><p>${esc(f.a)}</p></details>`)
    .join("");
  return `<section class="seo-faq"><h2>Questions fréquentes</h2>${items}</section>`;
}

/** Build the body content injected inside #root (real, crawlable content). */
export function renderBody(page: SeoPage): string {
  const intro = page.intro.map((p) => `<p>${esc(p)}</p>`).join("");
  const sections = (page.sections || []).map(renderSection).join("");
  const links = (page.internalLinks || []).map(renderLinkGroup).join("");
  return [
    `<div class="seo-prerender">`,
    `  <header>`,
    `    ${renderBreadcrumb(page.breadcrumb)}`,
    `    <h1>${esc(page.h1)}</h1>`,
    `  </header>`,
    `  <div class="seo-intro">${intro}</div>`,
    sections,
    renderFaq(page.faq),
    links,
    `</div>`,
  ].join("\n");
}

/** Inject head + body into the built index.html shell. */
export function injectIntoShell(shell: string, page: SeoPage): string {
  let html = shell;
  // Strip the shell's overridable, page-specific head tags so the
  // per-route values are the only ones present (no duplicate og:*/canonical).
  html = html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name="description"[^>]*>/i, "")
    .replace(/<meta\s+name="robots"[^>]*>/i, "")
    .replace(/<link\s+rel="canonical"[^>]*>/i, "")
    .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, "")
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, "");
  // Remove the static <noscript> fallback: prerendered pages now carry real
  // crawlable content inside #root, so the fallback would duplicate the H1.
  html = html.replace(/<noscript>[\s\S]*?<\/noscript>/i, "");
  const head = renderHead(page);
  html = html.replace(/<\/head>/i, `    ${head}\n  </head>`);
  // Inject prerendered content inside the (empty) #root div.
  const body = renderBody(page);
  html = html.replace(/<div id="root">\s*<\/div>/i, `<div id="root">${body}</div>`);
  return html;
}


// Local SEO pages: (ville | département | région) × (8 univers + 12 produits phares).
// Built from the REAL generated catalogue (pages.json categories + products.json
// fiches issued from the Print.com API) and the national geo reference.
// Never changes product URLs, prices, API or existing redirects.
import type { SeoPage, ProductCard, FaqItem, LinkItem } from "../../src/seo/types";
import { article } from "../../src/seo/content/fr";
import { seedOf } from "../../src/seo/content/geo-cities";
import { breadcrumbLd, serviceLd, webPageLd, faqLd } from "../../src/seo/schema";
import { loadGeo } from "./geo-data";

export type LocalScope = "ville" | "departement" | "region";

interface Offer {
  slug: string;          // local URL segment
  kind: "cat" | "product";
  ref: string;           // /categorie/x or /products/x
  label: string;         // plural label used in H1 ("Flyers")
  singular: string;      // lower-case noun ("flyers")
}

export const LOCAL_OFFERS: Offer[] = [
  { slug: "impression-papier", kind: "cat", ref: "/categorie/impression-papier", label: "Impression papier", singular: "impression papier" },
  { slug: "publicite-exterieure", kind: "cat", ref: "/categorie/publicite-exterieure", label: "Publicité extérieure", singular: "publicité extérieure" },
  { slug: "publicite-interieure-plv", kind: "cat", ref: "/categorie/publicite-interieure", label: "Publicité intérieure et PLV", singular: "PLV et publicité intérieure" },
  { slug: "etiquettes-stickers", kind: "cat", ref: "/categorie/etiquettes-stickers", label: "Étiquettes et stickers", singular: "étiquettes et stickers" },
  { slug: "emballages-sacs", kind: "cat", ref: "/categorie/emballages-sacs", label: "Emballages et sacs personnalisés", singular: "emballages personnalisés" },
  { slug: "objets-publicitaires", kind: "cat", ref: "/categorie/objets-publicitaires-cadeaux", label: "Objets publicitaires", singular: "objets publicitaires" },
  { slug: "textiles-personnalises", kind: "cat", ref: "/categorie/textiles-accessoires", label: "Textiles personnalisés", singular: "textiles personnalisés" },
  { slug: "panneaux-baches-grand-format", kind: "cat", ref: "/categorie/panneaux-baches-vinyles-toiles", label: "Panneaux et bâches grand format", singular: "impression grand format" },
  { slug: "flyers", kind: "product", ref: "/products/flyers", label: "Flyers", singular: "flyers" },
  { slug: "cartes-de-visite", kind: "product", ref: "/products/businesscards", label: "Cartes de visite", singular: "cartes de visite" },
  { slug: "depliants", kind: "product", ref: "/products/folders", label: "Dépliants", singular: "dépliants" },
  { slug: "affiches", kind: "product", ref: "/products/posters", label: "Affiches", singular: "affiches" },
  { slug: "brochures", kind: "product", ref: "/products/stapled-magazines", label: "Brochures", singular: "brochures" },
  { slug: "papier-en-tete", kind: "product", ref: "/products/printed-letterheads", label: "Papier à en-tête", singular: "papier à en-tête" },
  { slug: "stickers", kind: "product", ref: "/products/stickers", label: "Stickers", singular: "stickers" },
  { slug: "baches-publicitaires", kind: "product", ref: "/products/banners", label: "Bâches publicitaires", singular: "bâches publicitaires" },
  { slug: "roll-up", kind: "product", ref: "/products/roller-banners", label: "Roll-up", singular: "roll-up" },
  { slug: "beach-flags", kind: "product", ref: "/products/beachflags", label: "Beach flags", singular: "beach flags" },
  { slug: "sacs-en-toile", kind: "product", ref: "/products/canvas-tote-bags", label: "Sacs en toile personnalisés", singular: "sacs en toile" },
  { slug: "mugs-personnalises", kind: "product", ref: "/products/mugs", label: "Mugs personnalisés", singular: "mugs personnalisés" },
];

const pick = <T,>(arr: T[], seed: number, i = 0): T => arr[(seed + i) % arr.length];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const trunc = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1).replace(/[\s,;:–-]+\S*$/, "") + "…");

function specOf(p: SeoPage): string {
  // "Flyer à imprimer : formats A5, A4…. Prix affiché…" -> "formats A5, A4…"
  const m = (p.description || "").match(/:\s*(.+?)\.\s*Prix/);
  return m ? m[1].trim() : "";
}

interface Place {
  scope: LocalScope; slug: string; name: string;
  where: string;          // "à Saint-Lô" | "dans la Manche" | "en Normandie"
  code?: string; cp?: string;
  crumb: { name: string; path: string }[];
  up: LinkItem[];         // parent territories
  siblings: { slug: string; name: string }[];
}

export function buildLocalPages(pages: Record<string, SeoPage>, products: Record<string, SeoPage>): SeoPage[] {
  const geo = loadGeo();
  const home = { name: "Accueil", path: "/" };
  const zones = { name: "Zones desservies", path: "/imprimerie" };
  const deptBySlug = new Map(geo.departments.map((d) => [d.slug, d]));
  const cityBySlug = new Map(geo.cities.map((c) => [c.slug, c]));
  const places: Place[] = [];

  for (const c of geo.cities) {
    const d = deptBySlug.get(c.departmentSlug);
    places.push({
      scope: "ville", slug: c.slug, name: c.name, where: `à ${c.name}`, cp: c.postalCodes[0], code: c.departmentCode,
      crumb: [home, zones, { name: c.regionName, path: `/region/${c.regionSlug}` }, { name: c.departmentName, path: `/departement/${c.departmentSlug}` }, { name: c.name, path: `/ville/${c.slug}` }],
      up: [
        { label: `Imprimerie à ${c.name}`, path: `/ville/${c.slug}` },
        { label: `Impression ${article(c.departmentName).dans}`, path: `/departement/${c.departmentSlug}` },
        { label: `Impression ${article(c.regionName).dans}`, path: `/region/${c.regionSlug}` },
      ],
      siblings: (c.nearbyCitySlugs || []).filter((s) => cityBySlug.has(s)).slice(0, 5).map((s) => ({ slug: s, name: cityBySlug.get(s)!.name })),
    });
    void d;
  }
  for (const d of geo.departments) {
    places.push({
      scope: "departement", slug: d.slug, name: d.name, where: article(d.name).dans.startsWith("à ") ? `${article(d.name).dans} (${d.code})` : article(d.name).dans, code: d.code,
      crumb: [home, zones, { name: d.regionName, path: `/region/${d.regionSlug}` }, { name: d.name, path: `/departement/${d.slug}` }],
      up: [
        { label: `Imprimerie ${article(d.name).dans}`, path: `/departement/${d.slug}` },
        { label: `Impression ${article(d.regionName).dans}`, path: `/region/${d.regionSlug}` },
        ...d.citySlugs.filter((s) => cityBySlug.has(s)).slice(0, 3).map((s) => ({ label: `Imprimerie à ${cityBySlug.get(s)!.name}`, path: `/ville/${s}` })),
      ],
      siblings: (d.neighborDepartmentSlugs || []).filter((s) => deptBySlug.has(s)).slice(0, 5).map((s) => ({ slug: s, name: deptBySlug.get(s)!.name })),
    });
  }
  for (const r of geo.regions) {
    places.push({
      scope: "region", slug: r.slug, name: r.name, where: article(r.name).dans,
      crumb: [home, zones, { name: r.name, path: `/region/${r.slug}` }],
      up: [
        { label: `Imprimerie ${article(r.name).dans}`, path: `/region/${r.slug}` },
        ...r.departmentSlugs.filter((s) => deptBySlug.has(s)).slice(0, 4).map((s) => ({ label: `Impression ${article(deptBySlug.get(s)!.name).dans}`, path: `/departement/${s}` })),
      ],
      siblings: geo.regions.filter((x) => x.slug !== r.slug).slice(0, 0).map((x) => ({ slug: x.slug, name: x.name })),
    });
  }

  const out: SeoPage[] = [];
  const offers = LOCAL_OFFERS.filter((o) => (o.kind === "cat" ? pages[o.ref] : products[o.ref]));

  for (const pl of places) {
    for (const o of offers) {
      const src = o.kind === "cat" ? pages[o.ref] : products[o.ref];
      const seed = seedOf(`${pl.scope}/${pl.slug}/${o.slug}`);
      const path = `/${pl.scope}/${pl.slug}/${o.slug}`;
      const h1 = `${o.label} ${pl.where}`;
      const loc = pl.scope === "ville" && pl.cp ? `${pl.name} (${pl.cp})` : pl.code && pl.scope === "departement" ? `${pl.name} (${pl.code})` : pl.name;

      // Real catalogue data
      let cards: ProductCard[] = [];
      let facts = "";
      let subs: string[] = [];
      let image = "/seo/hero-flyers.jpg";
      if (o.kind === "cat") {
        cards = (src.productGrid?.cards || []).slice(0, 6);
        subs = ((src.internalLinks || []).find((g) => g.heading === "Sous-catégories")?.links || []).map((l) => l.label);
        facts = subs.length ? `L'univers couvre notamment : ${subs.slice(0, 5).join(", ").toLowerCase()}.` : "";
        image = src.visual?.image || src.hero?.image || image;
      } else {
        const spec = specOf(src);
        facts = spec ? `Options disponibles pour ${src.h1.toLowerCase()} : ${spec}.` : "";
        const rel = (src.internalLinks || []).find((g) => g.heading === "Produits complémentaires")?.links || [];
        cards = [
          { label: src.h1, path: o.ref, icon: "FileText", description: trunc(spec ? cap(spec) : src.description, 110) },
          ...rel.slice(0, 5).map((l) => {
            const rp = products[l.path];
            return { label: l.label, path: l.path, icon: "FileText", description: trunc(rp ? (specOf(rp) ? cap(specOf(rp)) : rp.description) : "Produit à configurer en ligne.", 110) };
          }),
        ];
        image = src.ogImage || image;
      }

      const openers = [
        `Vous cherchez des ${o.singular} ${pl.where} ? J2L Print vous permet de configurer votre commande en ligne et de voir le prix immédiatement, avant l'envoi de vos fichiers.`,
        `Pour vos ${o.singular} ${pl.where}, J2L Print réunit sur une même page la configuration, le prix affiché et la vérification de vos fichiers par notre équipe.`,
        `Commandez vos ${o.singular} depuis ${loc} : choisissez format, quantité et finitions, le tarif se met à jour à chaque option.`,
      ];
      const deliver = [
        `Les commandes sont fabriquées par nos partenaires d'impression puis livrées ${pl.where}, au bureau comme sur un lieu d'événement.`,
        `La livraison se fait directement ${pl.where} ; les délais estimés s'affichent avant validation de votre demande.`,
        `Nous expédions ${pl.where} et partout en métropole, avec une estimation de livraison visible pendant la configuration.`,
      ].map((s) => s.replace("partout en métropole", "en France métropolitaine"));
      const audiences = [
        "commerces, artisans et professions libérales",
        "associations, clubs et collectivités",
        "PME, agences et services communication",
        "restaurants, hôtels et lieux d'accueil",
      ];

      const intro = [pick(openers, seed), [facts, pick(deliver, seed, 1)].filter(Boolean).join(" ")];
      const sections = [
        {
          heading: `Pourquoi commander vos ${o.singular} en ligne ${pl.where}`,
          bullets: [
            "Prix affiché en ligne dès la configuration",
            "Contrôle de vos fichiers avant impression",
            `Livraison ${pl.where}`,
            `Adapté aux ${pick(audiences, seed)}`,
          ],
        },
        {
          heading: `Comment se passe une commande depuis ${pl.name}`,
          paragraphs: [
            `Ouvrez la fiche ${o.kind === "cat" ? "d'un produit de l'univers" : "produit"}, sélectionnez vos options puis ajoutez-la à votre demande. Notre équipe vérifie la configuration et vos fichiers, puis vous répond sous 48 heures ouvrées.`,
          ],
        },
      ];
      const faq: FaqItem[] = [
        { q: `Livrez-vous les ${o.singular} ${pl.where} ?`, a: `Oui, nous livrons ${pl.where}. Le délai estimé s'affiche pendant la configuration, selon les options choisies.` },
        { q: `Comment connaître le prix de mes ${o.singular} ?`, a: `Le prix se calcule en ligne à chaque choix de format, de quantité et de finition. Il est affiché hors taxes, hors livraison.` },
        { q: `Puis-je envoyer mon propre fichier ?`, a: `Oui. Vous pouvez joindre votre fichier à la demande ; il est vérifié avant impression. Une conception de maquette est aussi proposée.` },
      ];

      const siblings: LinkItem[] = pl.siblings.map((s) => ({ label: `${o.label} ${pl.scope === "ville" ? `à ${s.name}` : article(s.name).dans}`, path: `/${pl.scope}/${s.slug}/${o.slug}` }));
      const otherOffers: LinkItem[] = offers.filter((x) => x.slug !== o.slug).sort((a, b) => seedOf(seed + a.slug) - seedOf(seed + b.slug)).slice(0, 6)
        .map((x) => ({ label: `${x.label} ${pl.where}`, path: `/${pl.scope}/${pl.slug}/${x.slug}` }));
      const catLink: LinkItem[] = o.kind === "cat"
        ? [{ label: pages[o.ref].breadcrumb.at(-1)?.name || o.label, path: o.ref }]
        : [{ label: src.h1, path: o.ref }, ...(src.breadcrumb || []).filter((b) => b.path.startsWith("/categorie/")).slice(0, 2).map((b) => ({ label: b.name, path: b.path }))];

      const crumb = [...pl.crumb, { name: o.label, path }];
      const title = `${h1} – J2L Print`.length <= 60 ? `${h1} – J2L Print` : h1;
      const tail = o.kind === "cat" ? `${cards.length} produits réels à configurer.` : "Fichiers vérifiés avant impression.";
      const description = trunc(`${o.label} ${pl.where}${pl.scope === "ville" && pl.cp ? ` (${pl.cp})` : ""} : configuration en ligne, prix affiché et livraison ${pl.where}. ${tail}`, 158);

      out.push({
        path,
        title,
        description,
        h1,
        hero: {
          image, imageAlt: `${o.label} imprimés – livraison ${pl.where}`,
          eyebrow: `Livraison ${pl.where}`,
          tagline: `${cap(o.singular)} configurés en ligne et livrés ${pl.where}.`,
          ctas: [
            { label: o.kind === "cat" ? "Voir les produits" : "Configurer et voir le prix", path: o.ref, variant: "primary" },
            { label: "Demander un devis", path: "/#devis", variant: "secondary" },
          ],
        },
        intro,
        breadcrumb: crumb,
        sections,
        productGrid: { heading: `${o.label} disponibles ${pl.where}`, cards },
        cta: { label: o.kind === "cat" ? "Voir les produits" : "Configurer et voir le prix", path: o.ref },
        faq,
        internalLinks: [
          { heading: "Le catalogue", links: catLink },
          { heading: "Votre territoire", links: pl.up },
          ...(siblings.length ? [{ heading: pl.scope === "ville" ? "Villes proches" : "Départements voisins", links: siblings }] : []),
          { heading: `Autres impressions ${pl.where}`, links: otherOffers },
        ],
        jsonLd: [
          breadcrumbLd(crumb),
          webPageLd({ name: h1, description, path }),
          serviceLd({ name: h1, description: `${cap(o.singular)} imprimés et livrés ${pl.where}.`, areaServed: pl.name }),
          faqLd(faq),
        ],
      } as SeoPage);
    }
  }
  return out;
}

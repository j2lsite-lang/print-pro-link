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
  noun: string;          // bare noun phrase with the correct number
  search: string;        // phrase after "Vous cherchez"
  possessive: string;    // phrase after "vos/votre"
  definite: string;      // phrase after "Livrez-vous"
  configured: string;    // gender/number-aware past participle
  printed: string;
  delivered: string;
  available: string;
}

export const LOCAL_OFFERS: Offer[] = [
  { slug: "impression-papier", kind: "cat", ref: "/categorie/impression-papier", label: "Impression papier", noun: "impressions papier", search: "des impressions papier", possessive: "vos impressions papier", definite: "les impressions papier", configured: "configurées", printed: "imprimées", delivered: "livrées", available: "disponibles" },
  { slug: "publicite-exterieure", kind: "cat", ref: "/categorie/publicite-exterieure", label: "Publicité extérieure", noun: "publicité extérieure", search: "de la publicité extérieure", possessive: "votre publicité extérieure", definite: "la publicité extérieure", configured: "configurée", printed: "imprimée", delivered: "livrée", available: "disponible" },
  { slug: "publicite-interieure-plv", kind: "cat", ref: "/categorie/publicite-interieure", label: "Publicité intérieure et PLV", noun: "supports de PLV et de publicité intérieure", search: "des supports de PLV et de publicité intérieure", possessive: "vos supports de PLV et de publicité intérieure", definite: "les supports de PLV et de publicité intérieure", configured: "configurés", printed: "imprimés", delivered: "livrés", available: "disponibles" },
  { slug: "etiquettes-stickers", kind: "cat", ref: "/categorie/etiquettes-stickers", label: "Étiquettes et stickers", noun: "étiquettes et stickers", search: "des étiquettes et stickers", possessive: "vos étiquettes et stickers", definite: "les étiquettes et stickers", configured: "configurés", printed: "imprimés", delivered: "livrés", available: "disponibles" },
  { slug: "emballages-sacs", kind: "cat", ref: "/categorie/emballages-sacs", label: "Emballages et sacs personnalisés", noun: "emballages et sacs personnalisés", search: "des emballages et sacs personnalisés", possessive: "vos emballages et sacs personnalisés", definite: "les emballages et sacs personnalisés", configured: "configurés", printed: "imprimés", delivered: "livrés", available: "disponibles" },
  { slug: "objets-publicitaires", kind: "cat", ref: "/categorie/objets-publicitaires-cadeaux", label: "Objets publicitaires", noun: "objets publicitaires", search: "des objets publicitaires", possessive: "vos objets publicitaires", definite: "les objets publicitaires", configured: "configurés", printed: "imprimés", delivered: "livrés", available: "disponibles" },
  { slug: "textiles-personnalises", kind: "cat", ref: "/categorie/textiles-accessoires", label: "Textiles personnalisés", noun: "textiles personnalisés", search: "des textiles personnalisés", possessive: "vos textiles personnalisés", definite: "les textiles personnalisés", configured: "configurés", printed: "imprimés", delivered: "livrés", available: "disponibles" },
  { slug: "panneaux-baches-grand-format", kind: "cat", ref: "/categorie/panneaux-baches-vinyles-toiles", label: "Panneaux et bâches grand format", noun: "panneaux et bâches grand format", search: "des panneaux et bâches grand format", possessive: "vos panneaux et bâches grand format", definite: "les panneaux et bâches grand format", configured: "configurés", printed: "imprimés", delivered: "livrés", available: "disponibles" },
  { slug: "flyers", kind: "product", ref: "/products/flyers", label: "Flyers", noun: "flyers", search: "des flyers", possessive: "vos flyers", definite: "les flyers", configured: "configurés", printed: "imprimés", delivered: "livrés", available: "disponibles" },
  { slug: "cartes-de-visite", kind: "product", ref: "/products/businesscards", label: "Cartes de visite", noun: "cartes de visite", search: "des cartes de visite", possessive: "vos cartes de visite", definite: "les cartes de visite", configured: "configurées", printed: "imprimées", delivered: "livrées", available: "disponibles" },
  { slug: "depliants", kind: "product", ref: "/products/folders", label: "Dépliants", noun: "dépliants", search: "des dépliants", possessive: "vos dépliants", definite: "les dépliants", configured: "configurés", printed: "imprimés", delivered: "livrés", available: "disponibles" },
  { slug: "affiches", kind: "product", ref: "/products/posters", label: "Affiches", noun: "affiches", search: "des affiches", possessive: "vos affiches", definite: "les affiches", configured: "configurées", printed: "imprimées", delivered: "livrées", available: "disponibles" },
  { slug: "brochures", kind: "product", ref: "/products/stapled-magazines", label: "Brochures", noun: "brochures", search: "des brochures", possessive: "vos brochures", definite: "les brochures", configured: "configurées", printed: "imprimées", delivered: "livrées", available: "disponibles" },
  { slug: "papier-en-tete", kind: "product", ref: "/products/printed-letterheads", label: "Papier à en-tête", noun: "papier à en-tête", search: "du papier à en-tête", possessive: "votre papier à en-tête", definite: "le papier à en-tête", configured: "configuré", printed: "imprimé", delivered: "livré", available: "disponible" },
  { slug: "stickers", kind: "product", ref: "/products/stickers", label: "Stickers", noun: "stickers", search: "des stickers", possessive: "vos stickers", definite: "les stickers", configured: "configurés", printed: "imprimés", delivered: "livrés", available: "disponibles" },
  { slug: "baches-publicitaires", kind: "product", ref: "/products/banners", label: "Bâches publicitaires", noun: "bâches publicitaires", search: "des bâches publicitaires", possessive: "vos bâches publicitaires", definite: "les bâches publicitaires", configured: "configurées", printed: "imprimées", delivered: "livrées", available: "disponibles" },
  { slug: "roll-up", kind: "product", ref: "/products/roller-banners", label: "Roll-up", noun: "roll-up", search: "des roll-up", possessive: "vos roll-up", definite: "les roll-up", configured: "configurés", printed: "imprimés", delivered: "livrés", available: "disponibles" },
  { slug: "beach-flags", kind: "product", ref: "/products/beachflags", label: "Beach flags", noun: "beach flags", search: "des beach flags", possessive: "vos beach flags", definite: "les beach flags", configured: "configurés", printed: "imprimés", delivered: "livrés", available: "disponibles" },
  { slug: "sacs-en-toile", kind: "product", ref: "/products/canvas-tote-bags", label: "Sacs en toile personnalisés", noun: "sacs en toile personnalisés", search: "des sacs en toile personnalisés", possessive: "vos sacs en toile personnalisés", definite: "les sacs en toile personnalisés", configured: "configurés", printed: "imprimés", delivered: "livrés", available: "disponibles" },
  { slug: "mugs-personnalises", kind: "product", ref: "/products/mugs", label: "Mugs personnalisés", noun: "mugs personnalisés", search: "des mugs personnalisés", possessive: "vos mugs personnalisés", definite: "les mugs personnalisés", configured: "configurés", printed: "imprimés", delivered: "livrés", available: "disponibles" },
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
  from: string;           // "depuis Saint-Lô" | "depuis la Manche" | "depuis la Normandie"
  code?: string; cp?: string;
  crumb: { name: string; path: string }[];
  up: LinkItem[];         // parent territories
  siblings: { slug: string; name: string }[];
}

function fromArticle(name: string): string {
  return article(name).de
    .replace(/^de l'/, "depuis l'")
    .replace(/^de la /, "depuis la ")
    .replace(/^du /, "depuis le ")
    .replace(/^des /, "depuis les ")
    .replace(/^de /, "depuis ")
    .replace(/^d'/, "depuis ");
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
      scope: "ville", slug: c.slug, name: c.name, where: `à ${c.name}`, from: `depuis ${c.name}`, cp: c.postalCodes[0], code: c.departmentCode,
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
      scope: "departement", slug: d.slug, name: d.name, where: article(d.name).dans.startsWith("à ") ? `${article(d.name).dans} (${d.code})` : article(d.name).dans, from: fromArticle(d.name), code: d.code,
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
      scope: "region", slug: r.slug, name: r.name, where: article(r.name).dans, from: fromArticle(r.name),
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
        `Vous cherchez ${o.search} ${pl.where} ? J2L Print vous permet de configurer votre commande en ligne et de voir le prix immédiatement, avant l'envoi de vos fichiers.`,
        `Pour ${o.possessive} ${pl.where}, J2L Print réunit sur une même page la configuration, le prix affiché et la vérification de vos fichiers par notre équipe.`,
        `Commandez ${o.possessive} ${pl.from} : choisissez format, quantité et finitions, le tarif se met à jour à chaque option.`,
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
          heading: `Pourquoi commander ${o.possessive} en ligne ${pl.where}`,
          bullets: [
            "Prix affiché en ligne dès la configuration",
            "Contrôle de vos fichiers avant impression",
            `Livraison ${pl.where}`,
            `Adapté aux ${pick(audiences, seed)}`,
          ],
        },
        {
          heading: `Comment se passe une commande ${pl.from}`,
          paragraphs: [
            `Ouvrez la fiche ${o.kind === "cat" ? "d'un produit de l'univers" : "produit"}, sélectionnez vos options puis ajoutez-la à votre demande. Notre équipe vérifie la configuration et vos fichiers, puis vous répond sous 48 heures ouvrées.`,
          ],
        },
      ];
      const faq: FaqItem[] = [
        { q: `Livrez-vous ${o.definite} ${pl.where} ?`, a: `Oui, nous livrons ${pl.where}. Le délai estimé s'affiche pendant la configuration, selon les options choisies.` },
        { q: `Comment connaître le prix de ${o.possessive} ?`, a: `Le prix se calcule en ligne à chaque choix de format, de quantité et de finition. Il est affiché hors taxes, hors livraison.` },
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
          image, imageAlt: `${o.label} ${o.printed} – livraison ${pl.where}`,
          eyebrow: `Livraison ${pl.where}`,
          tagline: `${cap(o.noun)} ${o.configured} en ligne et ${o.delivered} ${pl.where}.`,
          ctas: [
            { label: o.kind === "cat" ? "Voir les produits" : "Configurer et voir le prix", path: o.ref, variant: "primary" },
            { label: "Demander un devis", path: "/#devis", variant: "secondary" },
          ],
        },
        intro,
        breadcrumb: crumb,
        sections,
        productGrid: { heading: `${o.label} ${o.available} ${pl.where}`, cards },
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
          serviceLd({ name: h1, description: `${cap(o.noun)} ${o.printed} et ${o.delivered} ${pl.where}.`, areaServed: pl.name }),
          faqLd(faq),
        ],
      } as SeoPage);
    }
  }
  return out;
}

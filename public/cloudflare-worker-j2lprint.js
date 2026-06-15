/**
 * =============================================================================
 *  J2L PRINT — Worker Cloudflare SEO complet
 * =============================================================================
 *  Date              : 2026-06-15
 *  Version           : 2.0.0  (remplace le proxy minimal « j2lprint-router »)
 *  Origine Lovable   : https://print-pro-link.lovable.app
 *  Domaine canonique : https://j2lprint.fr   (apex, sans www)
 *  Domaines publics  : https://j2lprint.fr , https://www.j2lprint.fr
 *
 *  RÔLE
 *  ----
 *  Le site Lovable reste l'ORIGINE. Ce Worker se contente de :
 *    1. forcer le domaine canonique (www -> apex en 301, http -> https) ;
 *    2. proxifier toutes les requêtes vers l'origine Lovable, sans rien casser ;
 *    3. préserver le HTML pré-rendu (title, meta, canonical, OG/Twitter, H1,
 *       JSON-LD BreadcrumbList/WebPage/Service/CollectionPage/Product/FAQPage,
 *       Organization unique du siège) déjà généré au build ;
 *    4. normaliser le domaine dans le HTML (origine -> canonique) ;
 *    5. appliquer une stratégie de cache sûre (SEO/assets oui, API/devis non) ;
 *    6. servir les sitemaps & robots.txt tels quels (XML non transformé).
 *
 *  Le Worker NE génère PAS de SEO artificiel et NE crée JAMAIS de faux
 *  LocalBusiness par ville : le siège réel reste la seule Organization.
 *  Il NE met JAMAIS en cache une réponse API, un prix, une configuration
 *  produit, un devis, un upload, un panier ou une requête authentifiée.
 *
 *  ROUTES GÉRÉES (servies via l'origine, HTML pré-rendu préservé)
 *  -------------------------------------------------------------
 *    6 routes statiques SEO        : /, /catalogue, /impression-numerique,
 *                                    /grand-format, /supports-publicitaires,
 *                                    /personnalisation
 *    8 catégories principales      : voir CATEGORIES
 *    47 sous-catégories            : voir SUBCATEGORIES
 *    16 villes publiées            : voir CITIES
 *    10 départements publiés       : voir DEPARTMENTS
 *    2 régions administratives     : uniquement documentées via départements,
 *                                    aucune route /region publiée
 *    8 familles produits SEO       : voir PRODUCT_FAMILIES
 *    Produits Print.com réels      : /products/{sku}, proxifié uniquement ;
 *                                    aucun SKU n'est créé, réécrit ou caché côté API
 *    Routes app publiques          : /products, /products/category/{slug},
 *                                    /blog, /livraison, pages légales
 *    Sitemaps / robots             : /sitemap.xml, /sitemaps/*.xml, /robots.txt
 *
 *  ROUTES NON ADVERTISÉES EN SEO :
 *    /produit/{slug}              -> n'existe pas (route réelle = /products/{sku})
 *    /region/{slug}               -> aucune page région pré-rendue
 *    /sitemaps/regions.xml        -> aucun sitemap région
 *    /sitemaps/products.xml       -> aucun sitemap produit/SKU
 *  (Elles passent quand même à l'origine ; le SPA renvoie 404 si absente.)
 *
 *  ROUTES EXCLUES DU CACHE (toujours proxifiées, jamais mises en cache)
 *  -------------------------------------------------------------------
 *    /cart , /checkout , /payment-success
 *    /auth , /account/* , /admin/*
 *    /unsubscribe
 *    toute requête POST/PUT/PATCH/DELETE/OPTIONS
 *    toute requête portant un cookie de session / en-tête Authorization
 *    tout appel API (Supabase, printcom-proxy, /functions/*, /rest/*, /api/*)
 *  Les appels Print.com / Supabase partent directement du navigateur vers
 *  *.supabase.co et ne transitent normalement pas par ce Worker ; les filtres
 *  ci-dessous sont une sécurité supplémentaire.
 * =============================================================================
 */

const LOVABLE_ORIGIN = "https://print-pro-link.lovable.app";
const ORIGIN_HOST = "print-pro-link.lovable.app";
const CANONICAL_HOST = "j2lprint.fr";
const CANONICAL_ORIGIN = "https://j2lprint.fr";

const HTML_TTL = 300; // 5 min — pages SEO publiques (public, max-age=300)
const ASSET_TTL = 31536000; // 1 an — assets versionnés (immutable)
const XML_TTL = 3600; // 1 h — sitemaps / robots

/* --- Référentiel des données réellement publiées (documentation + contrôle) --- */
const CITIES = [
  "chaumont", "colmar", "epinal", "luneville", "metz", "mulhouse", "nancy",
  "neufchateau", "reims", "remiremont", "saint-die-des-vosges", "sarreguemines",
  "strasbourg", "thionville", "troyes", "verdun",
]; // 16 villes

const DEPARTMENTS = [
  "vosges", "meurthe-et-moselle", "moselle", "bas-rhin", "haut-rhin",
  "haute-saone", "meuse", "marne", "aube", "haute-marne",
]; // 10 départements

const CATEGORIES = [
  "impression-papier", "publicite-exterieure", "publicite-interieure",
  "etiquettes-stickers", "emballages-sacs", "objets-publicitaires-cadeaux",
  "textiles-accessoires", "panneaux-baches-vinyles-toiles",
]; // 8 catégories principales (+ sous-catégories /categorie/{parent}/{enfant})

const SUBCATEGORIES = [
  "emballages-sacs/emballages-alimentaires",
  "emballages-sacs/emballages-cadeaux",
  "emballages-sacs/emballages-expedition",
  "emballages-sacs/sacs-tote-bags",
  "etiquettes-stickers/accessoires-autocollants",
  "etiquettes-stickers/autocollants-grand-format",
  "etiquettes-stickers/autocollants-rouleaux",
  "etiquettes-stickers/films-adhesifs-type",
  "etiquettes-stickers/petits-autocollants",
  "etiquettes-stickers/rubans-adhesifs",
  "impression-papier/brochures-magazines",
  "impression-papier/calendriers",
  "impression-papier/cartes-visite-enveloppes",
  "impression-papier/catering-restaurants",
  "impression-papier/courriers-creatifs",
  "impression-papier/flyers-depliants-affiches",
  "impression-papier/papeterie",
  "objets-publicitaires-cadeaux/articles-papeterie",
  "objets-publicitaires-cadeaux/bien-etre",
  "objets-publicitaires-cadeaux/gadgets",
  "objets-publicitaires-cadeaux/general",
  "objets-publicitaires-cadeaux/nourriture-boissons",
  "objets-publicitaires-cadeaux/saisonnalite",
  "objets-publicitaires-cadeaux/verrerie-vaisselle-gourdes",
  "panneaux-baches-vinyles-toiles/baches-banderoles",
  "panneaux-baches-vinyles-toiles/films-adhesifs",
  "panneaux-baches-vinyles-toiles/lookbooks",
  "panneaux-baches-vinyles-toiles/panneaux-accessoires",
  "panneaux-baches-vinyles-toiles/toiles-textiles",
  "publicite-exterieure/bannieres-structures-fixation",
  "publicite-exterieure/drapeaux-beachflags-accessoires",
  "publicite-exterieure/panneaux-accessoires-ext",
  "publicite-exterieure/stop-trottoirs-panneaux",
  "publicite-exterieure/tonnelles-mobilier-exterieur",
  "publicite-interieure/mobilier-interieur",
  "publicite-interieure/panneaux-accessoires-int",
  "publicite-interieure/presentoirs-materiel-plv",
  "publicite-interieure/roll-ups",
  "publicite-interieure/stands-materiel-expo",
  "publicite-interieure/toiles-textiles-deco-interieure",
  "textiles-accessoires/accessoires",
  "textiles-accessoires/cuisine-sejour",
  "textiles-accessoires/marquage-transferts-textiles",
  "textiles-accessoires/produits-bebes",
  "textiles-accessoires/textiles-bain",
  "textiles-accessoires/textiles-sport",
  "textiles-accessoires/vetements",
]; // 47 sous-catégories publiées dans /sitemaps/subcategories.xml

const SERVICES = [
  "impression-numerique", "grand-format", "supports-publicitaires", "personnalisation",
];

const REGIONS = [
  "grand-est", "bourgogne-franche-comte",
]; // 2 régions documentées via départements ; 0 route /region publiée

const PRODUCT_FAMILIES = [
  "flyers-et-depliants",
  "cartes-de-visite",
  "affiches-et-panneaux",
  "baches-et-banderoles",
  "objets-publicitaires",
  "textiles-personnalises",
  "plv-et-supports-evenementiels",
  "stickers-et-autocollants",
]; // Familles SEO éditoriales ; pas de liste SKU, pas de modification API Print.com

const STATIC_SEO_PATHS = [
  "/", "/catalogue", "/impression-numerique", "/grand-format",
  "/supports-publicitaires", "/personnalisation",
];

const APP_PUBLIC_PATH_PREFIXES = [
  "/products", "/products/category/", "/blog", "/livraison", "/mentions-legales",
  "/cgv", "/politique-retours", "/politique-confidentialite", "/imprimerie",
];

const MANAGED_SEO_PATHS = new Set([
  ...STATIC_SEO_PATHS,
  ...CATEGORIES.map((slug) => `/categorie/${slug}`),
  ...SUBCATEGORIES.map((slug) => `/categorie/${slug}`),
  ...CITIES.map((slug) => `/ville/${slug}`),
  ...DEPARTMENTS.map((slug) => `/departement/${slug}`),
]);

/* ---------------------------------------------------------------------------
 *  Helpers
 * ------------------------------------------------------------------------- */

/** Chemins jamais mis en cache (dynamiques / sensibles). */
function isNoCachePath(pathname) {
  return (
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname === "/payment-success" ||
    pathname === "/auth" ||
    pathname === "/unsubscribe" ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/rest/") ||
    pathname.startsWith("/functions/") ||
    pathname.startsWith("/auth/")
  );
}

/** Assets versionnés / statiques -> cache long immuable. */
function isImmutableAsset(pathname) {
  return (
    pathname.startsWith("/assets/") ||
    /\.(?:js|mjs|css|woff2?|ttf|otf|eot|png|jpe?g|webp|avif|gif|svg|ico|map)$/i.test(pathname)
  );
}

/** Sitemaps & robots -> XML/texte servis tels quels. */
function isXmlOrRobots(pathname) {
  return (
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/sitemaps/")
  );
}

/** HTML public éligible au cache court (toute page non exclue). */
function isCacheableHtml(pathname) {
  if (isNoCachePath(pathname)) return false;
  if (isImmutableAsset(pathname)) return false;
  if (isXmlOrRobots(pathname)) return false;
  // On NE met jamais en cache une fiche produit configurée : la route est
  // statique mais le configurateur charge ses données via l'API côté client.
  // La page HTML elle-même reste cacheable (5 min) car elle ne contient ni
  // prix ni configuration personnalisée ; seules les réponses API (hors Worker)
  // portent ces données. On garde donc /products/{sku} cacheable en HTML court.
  return true;
}

/** Réécrit les références au domaine d'origine vers le domaine canonique. */
function rewriteHtmlDomain(text) {
  return text
    .replaceAll(`https://${ORIGIN_HOST}`, CANONICAL_ORIGIN)
    .replaceAll(`http://${ORIGIN_HOST}`, CANONICAL_ORIGIN)
    .replaceAll(ORIGIN_HOST, CANONICAL_HOST);
}

/** En-têtes de sécurité non bloquants (pas de CSP stricte). */
function applySecurityHeaders(headers) {
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  headers.set("X-Worker", "j2lprint-seo/2.0.0");
}

/* ---------------------------------------------------------------------------
 *  Worker principal
 * ------------------------------------------------------------------------- */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1) Forcer HTTPS + domaine canonique (www -> apex) en 301.
    if (url.protocol === "http:" || url.hostname === `www.${CANONICAL_HOST}`) {
      const target = new URL(url.toString());
      target.protocol = "https:";
      target.hostname = CANONICAL_HOST;
      return Response.redirect(target.toString(), 301);
    }

    const { pathname } = url;
    const method = request.method.toUpperCase();
    const isReadMethod = method === "GET" || method === "HEAD";

    // 2) Construire la requête vers l'origine Lovable (anti-boucle de proxy :
    //    on cible explicitement l'origine, jamais le domaine public).
    const originUrl = new URL(url.pathname + url.search, LOVABLE_ORIGIN);
    const originRequest = new Request(originUrl.toString(), request);
    originRequest.headers.set("Host", ORIGIN_HOST);
    originRequest.headers.set("X-Forwarded-Host", CANONICAL_HOST);
    originRequest.headers.set("X-Forwarded-Proto", "https");

    // 3) Requêtes non-cacheables (méthodes mutantes, sessions, API, dynamiques)
    //    -> simple passthrough sans cache.
    const hasSession =
      request.headers.has("Authorization") ||
      /(?:sb-[^=]+-auth-token|sb-access-token|sb-refresh-token)/.test(
        request.headers.get("Cookie") || "",
      );

    const bypassCache =
      !isReadMethod || hasSession || isNoCachePath(pathname);

    if (bypassCache) {
      const resp = await fetch(originRequest);
      const out = new Response(resp.body, resp);
      out.headers.set("Cache-Control", "no-store");
      applySecurityHeaders(out.headers);
      return out;
    }

    // 4) Cache edge (caches.default) pour SEO / assets / XML.
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), { method: "GET" });
    let cached = await cache.match(cacheKey);
    if (cached) {
      const hit = new Response(cached.body, cached);
      hit.headers.set("X-Cache", "HIT");
      return hit;
    }

    // 5) Récupération origine.
    let response = await fetch(originRequest);
    const contentType = response.headers.get("Content-Type") || "";

    // 5a) Sitemaps & robots : servis tels quels, jamais transformés en HTML.
    if (isXmlOrRobots(pathname)) {
      const body = await response.text();
      const headers = new Headers(response.headers);
      if (pathname.endsWith(".xml")) {
        headers.set("Content-Type", "application/xml; charset=utf-8");
      } else {
        headers.set("Content-Type", "text/plain; charset=utf-8");
      }
      headers.set("Cache-Control", `public, max-age=${XML_TTL}`);
      headers.set("X-Cache", "MISS");
      applySecurityHeaders(headers);
      const out = new Response(body, { status: response.status, headers });
      if (response.status === 200) ctx.waitUntil(cache.put(cacheKey, out.clone()));
      return out;
    }

    // 5b) Assets versionnés : cache long immuable, sans réécriture.
    if (isImmutableAsset(pathname)) {
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", `public, max-age=${ASSET_TTL}, immutable`);
      headers.set("X-Cache", "MISS");
      const out = new Response(response.body, { status: response.status, headers });
      if (response.status === 200) ctx.waitUntil(cache.put(cacheKey, out.clone()));
      return out;
    }

    // 5c) HTML : préserver le pré-rendu SEO + normaliser le domaine.
    if (contentType.includes("text/html")) {
      let body = await response.text();
      body = rewriteHtmlDomain(body);

      const headers = new Headers(response.headers);
      headers.delete("Content-Length");
      if (isCacheableHtml(pathname) && response.status === 200) {
        headers.set("Cache-Control", `public, max-age=${HTML_TTL}`);
      } else {
        headers.set("Cache-Control", "no-store");
      }
      headers.set("X-Cache", "MISS");
      applySecurityHeaders(headers);

      const out = new Response(body, { status: response.status, headers });
      if (isCacheableHtml(pathname) && response.status === 200) {
        ctx.waitUntil(cache.put(cacheKey, out.clone()));
      }
      return out;
    }

    // 5d) Autres réponses (JSON statique, etc.) : passthrough prudent.
    {
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "no-store");
      headers.set("X-Cache", "BYPASS");
      return new Response(response.body, { status: response.status, headers });
    }
  },
};

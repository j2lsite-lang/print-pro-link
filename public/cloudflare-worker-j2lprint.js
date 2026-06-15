/**
 * =============================================================================
 *  J2L PRINT — Worker Cloudflare SEO COMPLET
 * =============================================================================
 *  Date              : 2026-06-15
 *  Version           : 3.0.0  (référentiel SEO COMPLET : produits, catégories,
 *                               sous-catégories, villes, départements, services,
 *                               sitemaps, robots ; cache sélectif strict)
 *  Origine Lovable   : https://print-pro-link.lovable.app
 *  Domaine canonique : https://j2lprint.fr   (apex, sans www)
 *  Domaines publics  : https://j2lprint.fr , https://www.j2lprint.fr
 *
 *  RÔLE
 *  ----
 *  Le site Lovable reste l'ORIGINE (SPA React pré-rendue au build). Ce Worker :
 *    1. force le domaine canonique (www -> apex en 301, http -> https) ;
 *    2. proxifie toutes les requêtes vers l'origine Lovable, sans rien casser ;
 *    3. préserve le HTML pré-rendu (title, meta, canonical, OG/Twitter, H1,
 *       JSON-LD BreadcrumbList/WebPage/Service/FAQPage, Organization du siège)
 *       déjà généré au build — AUCUN SEO artificiel, AUCUN faux LocalBusiness ;
 *    4. normalise le domaine dans le HTML (origine -> canonique) ;
 *    5. applique un cache SÉLECTIF (SEO/assets/sitemaps OUI ; dynamique NON) ;
 *    6. sert les sitemaps & robots.txt tels quels (XML/texte non transformés).
 *
 *  PRODUITS — /products/{sku}
 *  --------------------------
 *  Le configurateur produit est 100 % CLIENT-SIDE : la page /products/{sku}
 *  charge dynamiquement l'API Print.com (via printcom-proxy / Supabase) depuis
 *  le NAVIGATEUR. Ces appels NE transitent PAS par ce Worker. Le Worker :
 *    - laisse fonctionner l'API Print.com, les images, les options, le calcul
 *      des prix, le panier et le devis (aucune interception) ;
 *    - NE met JAMAIS en cache une réponse de configuration / prix / SKU ;
 *    - NE modifie JAMAIS un SKU ni un payload ;
 *    - NE pré-rend JAMAIS artificiellement un produit ;
 *    - conserve les canonicals réels servis par l'origine.
 *  => TOUT /products/* est exclu du cache (passthrough strict).
 *
 *  ROUTES GÉRÉES (SEO public, HTML pré-rendu préservé, cache court autorisé)
 *  -----------------------------------------------------------------------
 *    Statiques (6)        : /, /catalogue, /impression-numerique,
 *                           /grand-format, /supports-publicitaires,
 *                           /personnalisation
 *    Services (4)         : impression-numerique, grand-format,
 *                           supports-publicitaires, personnalisation
 *    Catégories (8)       : /categorie/{slug}                — voir CATEGORIES
 *    Sous-catégories (47) : /categorie/{parent}/{enfant}     — voir SUBCATEGORIES
 *    Villes (16)          : /ville/{slug} (+ /imprimerie/{slug}) — voir CITIES
 *    Départements (10)    : /departement/{slug}              — voir DEPARTMENTS
 *    Index local          : /imprimerie
 *    Éditorial / légal    : /blog, /livraison, /mentions-legales, /cgv,
 *                           /politique-retours, /politique-confidentialite
 *    Sitemaps / robots    : /sitemap.xml, /sitemaps/*.xml, /robots.txt
 *
 *  RÉGIONS
 *  -------
 *  Le code (src/App.tsx) NE déclare AUCUNE route /region/{slug} et aucune page
 *  région n'est pré-rendue. Les 2 régions administratives (Grand Est,
 *  Bourgogne-Franche-Comté) ne sont couvertes qu'INDIRECTEMENT via les
 *  départements. => 0 route /region gérée. Documenté dans REGIONS.
 *
 *  ROUTES EXCLUES DU CACHE (toujours proxifiées, jamais mises en cache)
 *  -------------------------------------------------------------------
 *    /products , /products/*  (configurateur, SKU, prix, catégories produits)
 *    /cart , /checkout , /payment-success
 *    /auth , /auth/* , /account/* , /admin/*
 *    /unsubscribe
 *    /api/* , /rest/* , /functions/*   (Supabase / printcom-proxy)
 *    toute requête POST/PUT/PATCH/DELETE/OPTIONS
 *    toute requête portant un cookie de session / en-tête Authorization
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

/* =============================================================================
 *  RÉFÉRENTIEL SEO RÉEL (synchronisé avec src/App.tsx + public/sitemaps/*.xml)
 * ========================================================================== */

/* --- 16 villes publiées (/ville/{slug} et /imprimerie/{slug}) -------------- */
const CITIES = [
  "chaumont", "colmar", "epinal", "luneville", "metz", "mulhouse", "nancy",
  "neufchateau", "reims", "remiremont", "saint-die-des-vosges", "sarreguemines",
  "strasbourg", "thionville", "troyes", "verdun",
]; // 16

/* --- 10 départements publiés (/departement/{slug}) ------------------------ */
const DEPARTMENTS = [
  "vosges", "meurthe-et-moselle", "moselle", "bas-rhin", "haut-rhin",
  "haute-saone", "meuse", "marne", "aube", "haute-marne",
]; // 10

/* --- 2 régions administratives : AUCUNE route /region publiée -------------- */
const REGIONS = [
  "grand-est", "bourgogne-franche-comte",
]; // documentées via départements uniquement ; 0 route /region

/* --- 4 services (routes statiques dédiées) -------------------------------- */
const SERVICES = [
  "impression-numerique", "grand-format", "supports-publicitaires", "personnalisation",
]; // 4

/* --- 8 catégories publiées (/categorie/{slug}) --------------------------- */
const CATEGORIES = [
  "impression-papier",
  "publicite-exterieure",
  "publicite-interieure",
  "etiquettes-stickers",
  "emballages-sacs",
  "objets-publicitaires-cadeaux",
  "textiles-accessoires",
  "panneaux-baches-vinyles-toiles",
]; // 8

/* --- 47 sous-catégories publiées (/categorie/{parent}/{enfant}) ----------- */
const SUBCATEGORIES = {
  "impression-papier": [
    "cartes-visite-enveloppes", "papeterie", "catering-restaurants",
    "brochures-magazines", "flyers-depliants-affiches", "calendriers",
    "courriers-creatifs",
  ], // 7
  "publicite-exterieure": [
    "stop-trottoirs-panneaux", "panneaux-accessoires-ext",
    "tonnelles-mobilier-exterieur", "drapeaux-beachflags-accessoires",
    "bannieres-structures-fixation",
  ], // 5
  "publicite-interieure": [
    "toiles-textiles-deco-interieure", "presentoirs-materiel-plv",
    "panneaux-accessoires-int", "stands-materiel-expo", "mobilier-interieur",
    "roll-ups",
  ], // 6
  "etiquettes-stickers": [
    "accessoires-autocollants", "petits-autocollants", "autocollants-grand-format",
    "rubans-adhesifs", "films-adhesifs-type", "autocollants-rouleaux",
  ], // 6
  "emballages-sacs": [
    "sacs-tote-bags", "emballages-alimentaires", "emballages-expedition",
    "emballages-cadeaux",
  ], // 4
  "objets-publicitaires-cadeaux": [
    "saisonnalite", "gadgets", "bien-etre", "nourriture-boissons",
    "articles-papeterie", "verrerie-vaisselle-gourdes", "general",
  ], // 7
  "textiles-accessoires": [
    "marquage-transferts-textiles", "accessoires", "textiles-bain",
    "cuisine-sejour", "vetements", "produits-bebes", "textiles-sport",
  ], // 7
  "panneaux-baches-vinyles-toiles": [
    "toiles-textiles", "films-adhesifs", "lookbooks", "panneaux-accessoires",
    "baches-banderoles",
  ], // 5
}; // total = 47

/* --- 6 routes statiques SEO ----------------------------------------------- */
const STATIC_SEO_PATHS = [
  "/", "/catalogue", "/impression-numerique", "/grand-format",
  "/supports-publicitaires", "/personnalisation",
];

/* --- HTML éditorial/légal proxifié, cacheable (pas de données dynamiques) -- */
const EDITORIAL_PATHS = [
  "/blog", "/imprimerie", "/livraison", "/mentions-legales", "/cgv",
  "/politique-retours", "/politique-confidentialite",
];

/* --- Sitemaps réellement existants ---------------------------------------- */
const KNOWN_SITEMAPS = [
  "/sitemap.xml",
  "/sitemaps/static.xml",
  "/sitemaps/categories.xml",
  "/sitemaps/subcategories.xml",
  "/sitemaps/cities.xml",
  "/sitemaps/departments.xml",
];

/* --- Registre des chemins SEO exacts (documentation + contrôle de cache) --- */
const MANAGED_SEO_PATHS = new Set([
  ...STATIC_SEO_PATHS,
  ...EDITORIAL_PATHS,
  ...CITIES.map((s) => `/ville/${s}`),
  ...CITIES.map((s) => `/imprimerie/${s}`),
  ...DEPARTMENTS.map((s) => `/departement/${s}`),
  ...CATEGORIES.map((s) => `/categorie/${s}`),
  ...Object.entries(SUBCATEGORIES).flatMap(([parent, children]) =>
    children.map((child) => `/categorie/${parent}/${child}`),
  ),
]);

/* =============================================================================
 *  Helpers
 * ========================================================================== */

/** Chemins dynamiques / sensibles : JAMAIS mis en cache.
 *  Inclut TOUT /products/* (configurateur, SKU, prix, catégories produits). */
function isNoCachePath(pathname) {
  return (
    pathname === "/products" ||
    pathname.startsWith("/products/") ||
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname === "/payment-success" ||
    pathname === "/auth" ||
    pathname === "/unsubscribe" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/rest/") ||
    pathname.startsWith("/functions/")
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

/** Catégorie ou sous-catégorie SEO réellement publiée. */
function isManagedCategoryPath(pathname) {
  const parts = pathname.split("/").filter(Boolean); // ["categorie", parent, child?]
  if (parts[0] !== "categorie") return false;
  if (parts.length === 2) return CATEGORIES.includes(parts[1]);
  if (parts.length === 3) {
    const children = SUBCATEGORIES[parts[1]];
    return Array.isArray(children) && children.includes(parts[2]);
  }
  return false;
}

/** HTML SEO public éligible au cache court (5 min). */
function isCacheableHtml(pathname) {
  if (isNoCachePath(pathname)) return false; // exclut /products/*, /cart, etc.
  if (isImmutableAsset(pathname)) return false;
  if (isXmlOrRobots(pathname)) return false;
  // Tout autre HTML public pré-rendu (statiques, services, villes,
  // départements, catégories, sous-catégories, éditorial/légal) est cacheable.
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
  headers.set("X-Worker", "j2lprint-seo/3.0.0");
}

/* =============================================================================
 *  Worker principal
 * ========================================================================== */
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

    // 3) Requêtes non-cacheables (méthodes mutantes, sessions, API, /products,
    //    routes dynamiques/sensibles) -> passthrough strict sans cache.
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
    const cached = await cache.match(cacheKey);
    if (cached) {
      const hit = new Response(cached.body, cached);
      hit.headers.set("X-Cache", "HIT");
      return hit;
    }

    // 5) Récupération origine.
    const response = await fetch(originRequest);
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

      const cacheable = isCacheableHtml(pathname) && response.status === 200;
      if (cacheable) {
        headers.set("Cache-Control", `public, max-age=${HTML_TTL}`);
      } else {
        headers.set("Cache-Control", "no-store");
      }
      // Marqueur de couverture SEO (diagnostic, sans impact fonctionnel).
      headers.set(
        "X-SEO-Managed",
        MANAGED_SEO_PATHS.has(pathname) || isManagedCategoryPath(pathname) ? "1" : "0",
      );
      headers.set("X-Cache", "MISS");
      applySecurityHeaders(headers);

      const out = new Response(body, { status: response.status, headers });
      if (cacheable) ctx.waitUntil(cache.put(cacheKey, out.clone()));
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

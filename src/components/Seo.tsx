import { Helmet } from "react-helmet-async";

export const SITE_URL = "https://j2lprint.fr";
export const SITE_NAME = "J2L Print";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

type JsonLd = Record<string, unknown> | Record<string, unknown>[];

interface SeoProps {
  /** Page title. " | J2L Print" is appended automatically unless already present. */
  title: string;
  description: string;
  /** Absolute path beginning with "/" (e.g. "/categorie/cartes-de-visite"). */
  path: string;
  ogType?: string;
  ogImage?: string;
  noindex?: boolean;
  jsonLd?: JsonLd;
}

/**
 * Centralised per-route head management via react-helmet-async.
 * Renders title, description, canonical, Open Graph, Twitter Cards,
 * robots and JSON-LD. Canonical and og:url always self-reference the page.
 */
export default function Seo({
  title,
  description,
  path,
  ogType = "website",
  ogImage = DEFAULT_OG_IMAGE,
  noindex = false,
  jsonLd,
}: SeoProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonical = `${SITE_URL}${path}`;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta
        name="robots"
        content={
          noindex
            ? "noindex, follow"
            : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        }
      />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="fr_FR" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
}

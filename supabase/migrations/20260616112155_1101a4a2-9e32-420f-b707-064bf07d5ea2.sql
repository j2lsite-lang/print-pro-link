-- Themes (collections) from Print.com — a secondary browse axis over existing products.
-- Does NOT touch existing categories or mappings.

CREATE TABLE public.product_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_themes TO anon, authenticated;
GRANT ALL ON public.product_themes TO service_role;

ALTER TABLE public.product_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Themes are publicly readable"
  ON public.product_themes FOR SELECT USING (true);

CREATE TABLE public.product_theme_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL,
  theme_id uuid NOT NULL REFERENCES public.product_themes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sku, theme_id)
);

GRANT SELECT ON public.product_theme_mappings TO anon, authenticated;
GRANT ALL ON public.product_theme_mappings TO service_role;

ALTER TABLE public.product_theme_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Theme mappings are publicly readable"
  ON public.product_theme_mappings FOR SELECT USING (true);

CREATE INDEX idx_product_theme_mappings_sku ON public.product_theme_mappings(sku);
CREATE INDEX idx_product_theme_mappings_theme ON public.product_theme_mappings(theme_id);
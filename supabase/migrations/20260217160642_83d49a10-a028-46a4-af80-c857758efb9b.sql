
-- Categories table with parent_id for subcategories
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mapping table: SKU to category (many-to-many)
CREATE TABLE public.product_category_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sku, category_id)
);

-- Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_category_mappings ENABLE ROW LEVEL SECURITY;

-- Categories are readable by everyone (public catalog)
CREATE POLICY "Categories are publicly readable"
  ON public.product_categories FOR SELECT USING (true);

-- Mappings are publicly readable
CREATE POLICY "Category mappings are publicly readable"
  ON public.product_category_mappings FOR SELECT USING (true);

-- Index for fast lookups
CREATE INDEX idx_product_category_mappings_sku ON public.product_category_mappings(sku);
CREATE INDEX idx_product_category_mappings_category ON public.product_category_mappings(category_id);
CREATE INDEX idx_product_categories_parent ON public.product_categories(parent_id);
CREATE INDEX idx_product_categories_slug ON public.product_categories(slug);


-- Table to store product images from Print.com CMS JSON
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku text NOT NULL UNIQUE,
  image_url text NOT NULL,
  thumbnail_url text,
  source text DEFAULT 'printcom_cms',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Product images are publicly readable"
  ON public.product_images
  FOR SELECT
  USING (true);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION public.update_product_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_product_images_updated_at
  BEFORE UPDATE ON public.product_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_images_updated_at();

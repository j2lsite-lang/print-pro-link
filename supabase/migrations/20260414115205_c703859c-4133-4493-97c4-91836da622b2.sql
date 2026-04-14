
CREATE TABLE public.cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  cp TEXT NOT NULL,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cities are publicly readable"
ON public.cities
FOR SELECT
USING (true);

CREATE INDEX idx_cities_slug ON public.cities (slug);
CREATE INDEX idx_cities_region ON public.cities (region);

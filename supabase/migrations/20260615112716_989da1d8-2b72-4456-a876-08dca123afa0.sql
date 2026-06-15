-- Quote requests table (demande de devis) — no online payment
CREATE TABLE public.quote_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  message TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_total NUMERIC,
  shipping_cost NUMERIC,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.quote_requests TO anon;
GRANT SELECT, INSERT ON public.quote_requests TO authenticated;
GRANT ALL ON public.quote_requests TO service_role;

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can create a quote request
CREATE POLICY "Anyone can create a quote request"
  ON public.quote_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated team members can read quote requests
CREATE POLICY "Authenticated can view quote requests"
  ON public.quote_requests FOR SELECT
  TO authenticated
  USING (true);

-- Storage: allow anonymous uploads only inside the quotes/ folder of print-files
CREATE POLICY "Anyone can upload quote files"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'print-files'
    AND (storage.foldername(name))[1] = 'quotes'
  );

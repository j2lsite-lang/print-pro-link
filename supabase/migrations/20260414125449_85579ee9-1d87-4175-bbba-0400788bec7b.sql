
-- Table for quote requests (demande de devis)
CREATE TABLE public.devis_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  product TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.devis_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert devis requests"
  ON public.devis_requests FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can view devis requests"
  ON public.devis_requests FOR SELECT
  TO authenticated
  USING (true);

-- Table for callback requests (demande de rappel)
CREATE TABLE public.callback_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  time_slot TEXT,
  subject TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.callback_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert callback requests"
  ON public.callback_requests FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can view callback requests"
  ON public.callback_requests FOR SELECT
  TO authenticated
  USING (true);

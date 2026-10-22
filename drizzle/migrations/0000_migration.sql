DROP POLICY IF EXISTS "Anyone can create a quote request" ON public.quote_requests;
REVOKE INSERT ON public.quote_requests FROM anon, authenticated;
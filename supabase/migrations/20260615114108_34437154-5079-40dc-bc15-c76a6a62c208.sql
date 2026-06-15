ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS products_total_ht numeric,
  ADD COLUMN IF NOT EXISTS shipping_amount_ht numeric NOT NULL DEFAULT 11.90,
  ADD COLUMN IF NOT EXISTS estimated_total_ht numeric;
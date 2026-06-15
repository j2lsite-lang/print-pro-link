-- 1. Addresses: restrict INSERT to the owner
DROP POLICY IF EXISTS "Anyone can insert addresses" ON public.addresses;
CREATE POLICY "Users insert own addresses"
ON public.addresses FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Callback requests: only backend can read PII
DROP POLICY IF EXISTS "Only authenticated users can view callback requests" ON public.callback_requests;
CREATE POLICY "Service role can read callback requests"
ON public.callback_requests FOR SELECT
USING (auth.role() = 'service_role');

-- 3. Devis requests: only backend can read PII
DROP POLICY IF EXISTS "Only authenticated users can view devis requests" ON public.devis_requests;
CREATE POLICY "Service role can read devis requests"
ON public.devis_requests FOR SELECT
USING (auth.role() = 'service_role');

-- 4. Quote requests: only backend can read PII
DROP POLICY IF EXISTS "Authenticated can view quote requests" ON public.quote_requests;
CREATE POLICY "Service role can read quote requests"
ON public.quote_requests FOR SELECT
USING (auth.role() = 'service_role');

-- 5. Carts: remove the NULL-owner loophole
DROP POLICY IF EXISTS "Users manage own cart" ON public.carts;
CREATE POLICY "Users manage own cart"
ON public.carts FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Cart items: remove the NULL-owner loophole
DROP POLICY IF EXISTS "Users manage own cart items" ON public.cart_items;
CREATE POLICY "Users manage own cart items"
ON public.cart_items FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()));

-- 7. Orders: enforce ownership on INSERT
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
CREATE POLICY "Users insert own orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 8. Order items: enforce ownership on INSERT
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Users insert items for own orders"
ON public.order_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.orders
  WHERE orders.id = order_items.order_id
    AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
));

-- 9. Storage: allow users to update/delete their own print files
CREATE POLICY "Users update own files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'print-files' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'print-files' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'print-files' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 10. Lock down internal pgmq wrapper functions + fix search_path
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, public;

ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
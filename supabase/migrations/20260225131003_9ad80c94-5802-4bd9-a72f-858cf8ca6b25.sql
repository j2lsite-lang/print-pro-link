-- Allow guest inserts on addresses (user_id can be null)
DROP POLICY IF EXISTS "Users manage own addresses" ON public.addresses;
CREATE POLICY "Anyone can insert addresses" ON public.addresses FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own addresses" ON public.addresses FOR SELECT USING (auth.uid() = user_id);

-- Allow guest inserts on orders
DROP POLICY IF EXISTS "Users manage own orders" ON public.orders;
CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);

-- Allow guest inserts on order_items
DROP POLICY IF EXISTS "Users view own order items" ON public.order_items;
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
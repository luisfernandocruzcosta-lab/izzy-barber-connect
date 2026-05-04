
-- Restrict barber_shops SELECT to authenticated users only (hides phone from anon)
DROP POLICY IF EXISTS "Anyone can view barber shops" ON public.barber_shops;

CREATE POLICY "Authenticated users can view barber shops"
ON public.barber_shops
FOR SELECT
TO authenticated
USING (true);

-- Public view (no phone) for anon listing
CREATE OR REPLACE VIEW public.barber_shops_public
WITH (security_invoker = on) AS
SELECT id, name, address, description, logo_url, owner_user_id, created_at, updated_at
FROM public.barber_shops;

GRANT SELECT ON public.barber_shops_public TO anon, authenticated;


-- Revoke direct column access for phone
REVOKE SELECT (phone) ON public.barber_shops FROM anon, authenticated;
-- Owners/admins use this function to fetch phone safely
CREATE OR REPLACE FUNCTION public.get_shop_phone(_shop_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT phone FROM public.barber_shops
  WHERE id = _shop_id
    AND (
      public.is_shop_staff_member(auth.uid(), _shop_id)
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.shop_id = _shop_id AND a.client_user_id = auth.uid()
      )
    );
$$;

REVOKE EXECUTE ON FUNCTION public.get_shop_phone(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_shop_phone(uuid) TO authenticated;

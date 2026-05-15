
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_shop_owner(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_shop_staff_member(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_staff_owner(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_shop_phone(uuid) TO authenticated, anon;

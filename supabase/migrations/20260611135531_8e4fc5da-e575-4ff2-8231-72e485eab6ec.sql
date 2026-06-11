ALTER VIEW public.barber_shops_public SET (security_invoker = false);
GRANT SELECT ON public.barber_shops_public TO anon, authenticated;
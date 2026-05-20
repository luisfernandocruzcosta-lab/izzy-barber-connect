
REVOKE EXECUTE ON FUNCTION public.get_available_slots(uuid, uuid, date) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.reschedule_appointment(uuid, timestamptz) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.cancel_appointment(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.create_default_shop_settings() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.apply_auto_confirm() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.enforce_min_advance() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.prevent_appointment_overlap() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.audit_row_change() FROM anon, public;

GRANT EXECUTE ON FUNCTION public.get_available_slots(uuid, uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reschedule_appointment(uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_appointment(uuid, text) TO authenticated;

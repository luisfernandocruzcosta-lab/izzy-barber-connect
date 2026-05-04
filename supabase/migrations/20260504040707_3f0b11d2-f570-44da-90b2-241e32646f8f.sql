
-- 1) Prevent clients from setting privileged appointment statuses
CREATE OR REPLACE FUNCTION public.guard_appointment_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    -- Allow staff of the shop or admins to set any status
    IF public.is_shop_staff_member(auth.uid(), NEW.shop_id)
       OR public.has_role(auth.uid(), 'admin'::app_role) THEN
      RETURN NEW;
    END IF;
    -- Clients (the appointment owner) may only cancel
    IF NEW.client_user_id = auth.uid() AND NEW.status = 'cancelled' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Not allowed to change appointment status to %', NEW.status
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_appointment_status_change ON public.appointments;
CREATE TRIGGER guard_appointment_status_change
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.guard_appointment_status_change();

-- 2) Tighten reviews UPDATE policy to revalidate the appointment linkage
DROP POLICY IF EXISTS "Clients can update their own reviews" ON public.reviews;
CREATE POLICY "Clients can update their own reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING ((client_user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (
  ((client_user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = reviews.appointment_id
      AND a.client_user_id = reviews.client_user_id
      AND a.shop_id = reviews.shop_id
      AND a.staff_id = reviews.staff_id
  )
);

-- 3) Realtime: restrict channel subscriptions to authenticated users
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can use realtime" ON realtime.messages;
CREATE POLICY "Authenticated can use realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);

-- 4) Revoke direct EXECUTE on SECURITY DEFINER helpers from anon/authenticated.
-- They remain callable from RLS policies and triggers (definer context).
REVOKE EXECUTE ON FUNCTION public.is_shop_owner(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_staff_owner(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_shop_staff_member(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.grant_loyalty_on_completion() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.guard_appointment_status_change() FROM anon, authenticated, public;

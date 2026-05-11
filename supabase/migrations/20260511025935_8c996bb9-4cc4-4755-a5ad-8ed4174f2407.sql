
-- 1) Restrict appointment INSERT status for clients
DROP POLICY IF EXISTS "Clients can create their own appointments" ON public.appointments;
CREATE POLICY "Clients can create their own appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  client_user_id = auth.uid()
  AND status IN ('pending'::appointment_status, 'confirmed'::appointment_status)
);

-- 2) Require completed appointment for review insert
DROP POLICY IF EXISTS "Clients can create their own review after appointment" ON public.reviews;
CREATE POLICY "Clients can create their own review after appointment"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  client_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = reviews.appointment_id
      AND a.client_user_id = auth.uid()
      AND a.shop_id = reviews.shop_id
      AND a.staff_id = reviews.staff_id
      AND a.status = 'completed'::appointment_status
  )
);

-- 3) Restrict Realtime channel subscriptions
DROP POLICY IF EXISTS "Authenticated users can receive realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can subscribe to realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can read realtime" ON realtime.messages;

CREATE POLICY "Users can subscribe to own scoped channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow only channels prefixed with the user's own id, or shop channels where the user is staff/owner/admin
  (realtime.topic() LIKE 'user:' || auth.uid()::text || ':%')
  OR (realtime.topic() = 'user:' || auth.uid()::text)
  OR (
    realtime.topic() LIKE 'shop:%'
    AND public.is_shop_staff_member(
      auth.uid(),
      NULLIF(split_part(realtime.topic(), ':', 2), '')::uuid
    )
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

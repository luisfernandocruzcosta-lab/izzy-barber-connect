
-- Tighten reviews INSERT policy: shop_id and staff_id must match the appointment
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
  )
);

-- Explicit RESTRICTIVE deny so non-admins can never insert into user_roles
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

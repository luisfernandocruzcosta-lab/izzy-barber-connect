CREATE TYPE public.app_role AS ENUM ('admin', 'barber', 'client');
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  favorite_style TEXT,
  preferred_contact_channel TEXT DEFAULT 'whatsapp',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.barber_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  logo_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.shop_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.barber_shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  is_bookable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shop_id, user_id)
);

CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.barber_shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.shop_staff(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.barber_shops(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.shop_staff(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  status public.appointment_status NOT NULL DEFAULT 'pending',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  reminder_day_sent_at TIMESTAMPTZ,
  reminder_one_hour_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE TABLE public.client_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.shop_staff(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_user_id, staff_id)
);

CREATE TABLE public.loyalty_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.barber_shops(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_balance INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  total_visits INTEGER NOT NULL DEFAULT 0 CHECK (total_visits >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shop_id, client_user_id)
);

CREATE TABLE public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loyalty_account_id UUID NOT NULL REFERENCES public.loyalty_accounts(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  points_delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.barber_shops(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.shop_staff(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_barber_shops_owner_user_id ON public.barber_shops(owner_user_id);
CREATE INDEX idx_shop_staff_shop_id ON public.shop_staff(shop_id);
CREATE INDEX idx_shop_staff_user_id ON public.shop_staff(user_id);
CREATE INDEX idx_services_shop_id ON public.services(shop_id);
CREATE INDEX idx_availability_rules_staff_id ON public.availability_rules(staff_id);
CREATE INDEX idx_appointments_client_user_id ON public.appointments(client_user_id);
CREATE INDEX idx_appointments_shop_id ON public.appointments(shop_id);
CREATE INDEX idx_appointments_staff_id ON public.appointments(staff_id);
CREATE INDEX idx_appointments_starts_at ON public.appointments(starts_at);
CREATE INDEX idx_client_favorites_client_user_id ON public.client_favorites(client_user_id);
CREATE INDEX idx_loyalty_accounts_shop_client ON public.loyalty_accounts(shop_id, client_user_id);
CREATE INDEX idx_loyalty_transactions_loyalty_account_id ON public.loyalty_transactions(loyalty_account_id);
CREATE INDEX idx_reviews_shop_id ON public.reviews(shop_id);
CREATE INDEX idx_reviews_staff_id ON public.reviews(staff_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_shop_owner(_user_id UUID, _shop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.barber_shops
    WHERE id = _shop_id
      AND owner_user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_shop_staff_member(_user_id UUID, _shop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_shop_owner(_user_id, _shop_id)
    OR EXISTS (
      SELECT 1
      FROM public.shop_staff
      WHERE shop_id = _shop_id
        AND user_id = _user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.is_staff_owner(_user_id UUID, _staff_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shop_staff
    WHERE id = _staff_id
      AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_barber_shops_updated_at
BEFORE UPDATE ON public.barber_shops
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shop_staff_updated_at
BEFORE UPDATE ON public.shop_staff
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_availability_rules_updated_at
BEFORE UPDATE ON public.availability_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_accounts_updated_at
BEFORE UPDATE ON public.loyalty_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view barber shops"
ON public.barber_shops
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Barbers and admins can create barber shops"
ON public.barber_shops
FOR INSERT
TO authenticated
WITH CHECK (
  owner_user_id = auth.uid() AND (
    public.has_role(auth.uid(), 'barber') OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Owners and admins can update barber shops"
ON public.barber_shops
FOR UPDATE
TO authenticated
USING (public.is_shop_owner(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.is_shop_owner(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners and admins can delete barber shops"
ON public.barber_shops
FOR DELETE
TO authenticated
USING (public.is_shop_owner(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view staff"
ON public.shop_staff
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Shop owners and admins can manage staff"
ON public.shop_staff
FOR ALL
TO authenticated
USING (public.is_shop_owner(auth.uid(), shop_id) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.is_shop_owner(auth.uid(), shop_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view services"
ON public.services
FOR SELECT
TO authenticated, anon
USING (is_active = true OR public.is_shop_owner(auth.uid(), shop_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Shop owners and admins can manage services"
ON public.services
FOR ALL
TO authenticated
USING (public.is_shop_owner(auth.uid(), shop_id) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.is_shop_owner(auth.uid(), shop_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active availability"
ON public.availability_rules
FOR SELECT
TO authenticated, anon
USING (
  is_active = true
  OR public.is_staff_owner(auth.uid(), staff_id)
  OR EXISTS (
    SELECT 1
    FROM public.shop_staff ss
    WHERE ss.id = availability_rules.staff_id
      AND (public.is_shop_owner(auth.uid(), ss.shop_id) OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Staff owners shop owners and admins can manage availability"
ON public.availability_rules
FOR ALL
TO authenticated
USING (
  public.is_staff_owner(auth.uid(), staff_id)
  OR EXISTS (
    SELECT 1
    FROM public.shop_staff ss
    WHERE ss.id = availability_rules.staff_id
      AND (public.is_shop_owner(auth.uid(), ss.shop_id) OR public.has_role(auth.uid(), 'admin'))
  )
)
WITH CHECK (
  public.is_staff_owner(auth.uid(), staff_id)
  OR EXISTS (
    SELECT 1
    FROM public.shop_staff ss
    WHERE ss.id = availability_rules.staff_id
      AND (public.is_shop_owner(auth.uid(), ss.shop_id) OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Clients and staff can view related appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  client_user_id = auth.uid()
  OR public.is_shop_staff_member(auth.uid(), shop_id)
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Clients can create their own appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (client_user_id = auth.uid());

CREATE POLICY "Clients staff and admins can update related appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  client_user_id = auth.uid()
  OR public.is_shop_staff_member(auth.uid(), shop_id)
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  client_user_id = auth.uid()
  OR public.is_shop_staff_member(auth.uid(), shop_id)
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Clients and admins can delete their appointments"
ON public.appointments
FOR DELETE
TO authenticated
USING (
  client_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.is_shop_owner(auth.uid(), shop_id)
);

CREATE POLICY "Users can view own favorites"
ON public.client_favorites
FOR SELECT
TO authenticated
USING (client_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own favorites"
ON public.client_favorites
FOR INSERT
TO authenticated
WITH CHECK (client_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own favorites"
ON public.client_favorites
FOR DELETE
TO authenticated
USING (client_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients and shop staff can view loyalty accounts"
ON public.loyalty_accounts
FOR SELECT
TO authenticated
USING (
  client_user_id = auth.uid()
  OR public.is_shop_staff_member(auth.uid(), shop_id)
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Shop owners and admins can manage loyalty accounts"
ON public.loyalty_accounts
FOR ALL
TO authenticated
USING (public.is_shop_owner(auth.uid(), shop_id) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.is_shop_owner(auth.uid(), shop_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients and shop staff can view loyalty transactions"
ON public.loyalty_transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.loyalty_accounts la
    WHERE la.id = loyalty_transactions.loyalty_account_id
      AND (
        la.client_user_id = auth.uid()
        OR public.is_shop_staff_member(auth.uid(), la.shop_id)
        OR public.has_role(auth.uid(), 'admin')
      )
  )
);

CREATE POLICY "Shop owners and admins can manage loyalty transactions"
ON public.loyalty_transactions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.loyalty_accounts la
    WHERE la.id = loyalty_transactions.loyalty_account_id
      AND (public.is_shop_owner(auth.uid(), la.shop_id) OR public.has_role(auth.uid(), 'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.loyalty_accounts la
    WHERE la.id = loyalty_transactions.loyalty_account_id
      AND (public.is_shop_owner(auth.uid(), la.shop_id) OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Anyone can view reviews"
ON public.reviews
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Clients can create their own review after appointment"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  client_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.appointments a
    WHERE a.id = appointment_id
      AND a.client_user_id = auth.uid()
  )
);

CREATE POLICY "Clients can update their own reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (client_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (client_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can delete their own reviews"
ON public.reviews
FOR DELETE
TO authenticated
USING (client_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
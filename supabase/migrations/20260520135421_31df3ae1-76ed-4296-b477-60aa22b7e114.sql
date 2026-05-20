
-- =========================================================
-- 1) SHOP SETTINGS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.shop_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL UNIQUE,
  min_advance_minutes integer NOT NULL DEFAULT 30,
  cancel_window_minutes integer NOT NULL DEFAULT 120,
  auto_confirm boolean NOT NULL DEFAULT false,
  slot_interval_minutes integer NOT NULL DEFAULT 15,
  currency text NOT NULL DEFAULT 'BRL',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view shop settings"
  ON public.shop_settings FOR SELECT TO authenticated
  USING (public.is_shop_staff_member(auth.uid(), shop_id) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners and admins can manage shop settings"
  ON public.shop_settings FOR ALL TO authenticated
  USING (public.is_shop_owner(auth.uid(), shop_id) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.is_shop_owner(auth.uid(), shop_id) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_shop_settings_updated_at
  BEFORE UPDATE ON public.shop_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default settings for existing shops
INSERT INTO public.shop_settings (shop_id)
SELECT id FROM public.barber_shops
ON CONFLICT (shop_id) DO NOTHING;

-- Auto-create settings when a new shop is created
CREATE OR REPLACE FUNCTION public.create_default_shop_settings()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.shop_settings (shop_id) VALUES (NEW.id)
  ON CONFLICT (shop_id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_barber_shops_default_settings
  AFTER INSERT ON public.barber_shops
  FOR EACH ROW EXECUTE FUNCTION public.create_default_shop_settings();

-- =========================================================
-- 2) PAYMENTS
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('cash','pix','credit_card','debit_card','transfer','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending','paid','refunded','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL,
  shop_id uuid NOT NULL,
  client_user_id uuid NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  method public.payment_method NOT NULL DEFAULT 'cash',
  status public.payment_status NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  notes text,
  recorded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_shop_created ON public.payments(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_appointment ON public.payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_client ON public.payments(client_user_id, created_at DESC);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients and staff can view payments"
  ON public.payments FOR SELECT TO authenticated
  USING (
    client_user_id = auth.uid()
    OR public.is_shop_staff_member(auth.uid(), shop_id)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Staff and admins can insert payments"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (
    (public.is_shop_staff_member(auth.uid(), shop_id) OR public.has_role(auth.uid(), 'admin'::app_role))
    AND recorded_by = auth.uid()
  );

CREATE POLICY "Staff and admins can update payments"
  ON public.payments FOR UPDATE TO authenticated
  USING (public.is_shop_staff_member(auth.uid(), shop_id) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.is_shop_staff_member(auth.uid(), shop_id) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners and admins can delete payments"
  ON public.payments FOR DELETE TO authenticated
  USING (public.is_shop_owner(auth.uid(), shop_id) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 3) AUDIT LOG
-- =========================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id bigserial PRIMARY KEY,
  table_name text NOT NULL,
  record_id uuid,
  shop_id uuid,
  action text NOT NULL, -- INSERT / UPDATE / DELETE
  actor_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_shop_created ON public.audit_log(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_record ON public.audit_log(table_name, record_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and admins can view audit log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (
    (shop_id IS NOT NULL AND public.is_shop_owner(auth.uid(), shop_id))
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
-- No INSERT/UPDATE/DELETE policies => only SECURITY DEFINER triggers can write.

CREATE OR REPLACE FUNCTION public.audit_row_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_shop_id uuid;
  v_record_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_record_id := OLD.id;
    BEGIN v_shop_id := (to_jsonb(OLD)->>'shop_id')::uuid; EXCEPTION WHEN OTHERS THEN v_shop_id := NULL; END;
    INSERT INTO public.audit_log(table_name, record_id, shop_id, action, actor_id, old_data)
    VALUES (TG_TABLE_NAME, v_record_id, v_shop_id, TG_OP, auth.uid(), to_jsonb(OLD));
    RETURN OLD;
  ELSE
    v_record_id := NEW.id;
    BEGIN v_shop_id := (to_jsonb(NEW)->>'shop_id')::uuid; EXCEPTION WHEN OTHERS THEN v_shop_id := NULL; END;
    INSERT INTO public.audit_log(table_name, record_id, shop_id, action, actor_id, old_data, new_data)
    VALUES (TG_TABLE_NAME, v_record_id, v_shop_id, TG_OP, auth.uid(),
            CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
            to_jsonb(NEW));
    RETURN NEW;
  END IF;
END; $$;

CREATE TRIGGER trg_audit_appointments AFTER INSERT OR UPDATE OR DELETE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_audit_payments AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_audit_services AFTER INSERT OR UPDATE OR DELETE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_audit_shop_staff AFTER INSERT OR UPDATE OR DELETE ON public.shop_staff
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_audit_barber_shops AFTER INSERT OR UPDATE OR DELETE ON public.barber_shops
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

-- =========================================================
-- 4) APPOINTMENT INDEXES + ANTI-OVERLAP + AUTO-CONFIRM + ADVANCE WINDOW
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_appointments_staff_starts ON public.appointments(staff_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_shop_starts ON public.appointments(shop_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_client_starts ON public.appointments(client_user_id, starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- Anti-overlap: no two active appointments for the same staff may overlap
CREATE OR REPLACE FUNCTION public.prevent_appointment_overlap()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('cancelled') THEN
    RETURN NEW;
  END IF;
  IF NEW.ends_at <= NEW.starts_at THEN
    RAISE EXCEPTION 'Horário inválido: término deve ser após o início' USING ERRCODE='22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.staff_id = NEW.staff_id
      AND a.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND a.status NOT IN ('cancelled')
      AND a.starts_at < NEW.ends_at
      AND a.ends_at   > NEW.starts_at
  ) THEN
    RAISE EXCEPTION 'Conflito de horário: o barbeiro já possui outro agendamento neste intervalo'
      USING ERRCODE='23P01';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_appointments_no_overlap
  BEFORE INSERT OR UPDATE OF starts_at, ends_at, staff_id, status ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.prevent_appointment_overlap();

-- Auto-confirm based on shop_settings.auto_confirm
CREATE OR REPLACE FUNCTION public.apply_auto_confirm()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_auto boolean;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT auto_confirm INTO v_auto FROM public.shop_settings WHERE shop_id = NEW.shop_id;
    IF COALESCE(v_auto,false) THEN
      NEW.status := 'confirmed';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_appointments_auto_confirm
  BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.apply_auto_confirm();

-- Enforce min advance time for client-created appointments
CREATE OR REPLACE FUNCTION public.enforce_min_advance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_min int;
BEGIN
  -- Skip for staff/admin (they can book any time)
  IF public.is_shop_staff_member(auth.uid(), NEW.shop_id)
     OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  SELECT min_advance_minutes INTO v_min FROM public.shop_settings WHERE shop_id = NEW.shop_id;
  v_min := COALESCE(v_min, 30);
  IF NEW.starts_at < now() + make_interval(mins => v_min) THEN
    RAISE EXCEPTION 'Agendamento exige antecedência mínima de % minutos', v_min USING ERRCODE='22023';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_appointments_min_advance
  BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_min_advance();

-- =========================================================
-- 5) RPCs: available slots, reschedule, cancel
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_available_slots(
  _staff_id uuid,
  _service_id uuid,
  _date date
)
RETURNS TABLE(slot_start timestamptz, slot_end timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_shop_id uuid;
  v_duration int;
  v_interval int;
  v_min_advance int;
  r record;
  v_cursor timestamptz;
  v_end_window timestamptz;
  v_slot_end timestamptz;
BEGIN
  SELECT shop_id, duration_minutes INTO v_shop_id, v_duration
    FROM public.services WHERE id = _service_id AND is_active = true;
  IF v_shop_id IS NULL THEN
    RETURN;
  END IF;

  SELECT slot_interval_minutes, min_advance_minutes
    INTO v_interval, v_min_advance
    FROM public.shop_settings WHERE shop_id = v_shop_id;
  v_interval := COALESCE(v_interval, 15);
  v_min_advance := COALESCE(v_min_advance, 30);

  FOR r IN
    SELECT start_time, end_time
    FROM public.availability_rules
    WHERE staff_id = _staff_id
      AND is_active = true
      AND weekday = EXTRACT(DOW FROM _date)::smallint
  LOOP
    v_cursor := (_date::timestamp + r.start_time) AT TIME ZONE 'UTC';
    v_end_window := (_date::timestamp + r.end_time) AT TIME ZONE 'UTC';
    WHILE v_cursor + make_interval(mins => v_duration) <= v_end_window LOOP
      v_slot_end := v_cursor + make_interval(mins => v_duration);
      IF v_cursor >= now() + make_interval(mins => v_min_advance)
         AND NOT EXISTS (
           SELECT 1 FROM public.appointments a
           WHERE a.staff_id = _staff_id
             AND a.status NOT IN ('cancelled')
             AND a.starts_at < v_slot_end
             AND a.ends_at   > v_cursor
         )
      THEN
        slot_start := v_cursor;
        slot_end := v_slot_end;
        RETURN NEXT;
      END IF;
      v_cursor := v_cursor + make_interval(mins => v_interval);
    END LOOP;
  END LOOP;
END; $$;

CREATE OR REPLACE FUNCTION public.reschedule_appointment(
  _appointment_id uuid,
  _new_start timestamptz
) RETURNS public.appointments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a public.appointments;
  v_duration int;
BEGIN
  SELECT * INTO a FROM public.appointments WHERE id = _appointment_id;
  IF a IS NULL THEN RAISE EXCEPTION 'Agendamento não encontrado' USING ERRCODE='P0002'; END IF;

  IF NOT (a.client_user_id = auth.uid()
          OR public.is_shop_staff_member(auth.uid(), a.shop_id)
          OR public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Sem permissão para reagendar' USING ERRCODE='42501';
  END IF;

  v_duration := EXTRACT(EPOCH FROM (a.ends_at - a.starts_at))/60;
  UPDATE public.appointments
     SET starts_at = _new_start,
         ends_at   = _new_start + make_interval(mins => v_duration::int),
         updated_at = now()
   WHERE id = _appointment_id
   RETURNING * INTO a;
  RETURN a;
END; $$;

CREATE OR REPLACE FUNCTION public.cancel_appointment(
  _appointment_id uuid,
  _reason text DEFAULT NULL
) RETURNS public.appointments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a public.appointments;
  v_window int;
BEGIN
  SELECT * INTO a FROM public.appointments WHERE id = _appointment_id;
  IF a IS NULL THEN RAISE EXCEPTION 'Agendamento não encontrado' USING ERRCODE='P0002'; END IF;

  IF NOT (a.client_user_id = auth.uid()
          OR public.is_shop_staff_member(auth.uid(), a.shop_id)
          OR public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Sem permissão para cancelar' USING ERRCODE='42501';
  END IF;

  -- Enforce cancel window for clients
  IF a.client_user_id = auth.uid()
     AND NOT public.is_shop_staff_member(auth.uid(), a.shop_id)
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    SELECT cancel_window_minutes INTO v_window FROM public.shop_settings WHERE shop_id = a.shop_id;
    v_window := COALESCE(v_window, 120);
    IF a.starts_at < now() + make_interval(mins => v_window) THEN
      RAISE EXCEPTION 'Cancelamento deve ocorrer com pelo menos % minutos de antecedência', v_window
        USING ERRCODE='22023';
    END IF;
  END IF;

  UPDATE public.appointments
     SET status = 'cancelled',
         notes = COALESCE(NULLIF(_reason,''), notes),
         updated_at = now()
   WHERE id = _appointment_id
   RETURNING * INTO a;
  RETURN a;
END; $$;

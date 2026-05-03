CREATE OR REPLACE FUNCTION public.grant_loyalty_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id uuid;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    INSERT INTO public.loyalty_accounts (client_user_id, shop_id, points_balance, total_visits)
    VALUES (NEW.client_user_id, NEW.shop_id, 10, 1)
    ON CONFLICT (client_user_id, shop_id) DO UPDATE
      SET points_balance = public.loyalty_accounts.points_balance + 10,
          total_visits = public.loyalty_accounts.total_visits + 1,
          updated_at = now()
    RETURNING id INTO v_account_id;

    IF v_account_id IS NULL THEN
      SELECT id INTO v_account_id FROM public.loyalty_accounts
      WHERE client_user_id = NEW.client_user_id AND shop_id = NEW.shop_id;
    END IF;

    INSERT INTO public.loyalty_transactions (loyalty_account_id, points_delta, reason, appointment_id)
    VALUES (v_account_id, 10, 'Atendimento concluído', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Garantir índice único para o ON CONFLICT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'loyalty_accounts_client_shop_unique'
  ) THEN
    CREATE UNIQUE INDEX loyalty_accounts_client_shop_unique
      ON public.loyalty_accounts(client_user_id, shop_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_grant_loyalty ON public.appointments;
CREATE TRIGGER trg_grant_loyalty
AFTER UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.grant_loyalty_on_completion();
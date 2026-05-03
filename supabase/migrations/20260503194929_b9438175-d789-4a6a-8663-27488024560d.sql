-- Enum de categorias de despesa
CREATE TYPE public.expense_category AS ENUM (
  'produtos',
  'aluguel',
  'energia',
  'salarios',
  'marketing',
  'equipamentos',
  'outros'
);

-- Tabela de despesas
CREATE TABLE public.shop_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL,
  category public.expense_category NOT NULL DEFAULT 'outros',
  description text,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_shop_expenses_shop_date ON public.shop_expenses(shop_id, expense_date DESC);

ALTER TABLE public.shop_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners and admins can view expenses"
ON public.shop_expenses FOR SELECT
TO authenticated
USING (public.is_shop_owner(auth.uid(), shop_id) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Shop owners and admins can insert expenses"
ON public.shop_expenses FOR INSERT
TO authenticated
WITH CHECK (
  (public.is_shop_owner(auth.uid(), shop_id) OR public.has_role(auth.uid(), 'admin'::app_role))
  AND created_by = auth.uid()
);

CREATE POLICY "Shop owners and admins can update expenses"
ON public.shop_expenses FOR UPDATE
TO authenticated
USING (public.is_shop_owner(auth.uid(), shop_id) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.is_shop_owner(auth.uid(), shop_id) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Shop owners and admins can delete expenses"
ON public.shop_expenses FOR DELETE
TO authenticated
USING (public.is_shop_owner(auth.uid(), shop_id) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_shop_expenses_updated_at
BEFORE UPDATE ON public.shop_expenses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lifetime purchases (PLUS vitalício, pagamento único)
CREATE TABLE IF NOT EXISTS public.lifetime_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_session_id text NOT NULL UNIQUE,
  stripe_customer_id text,
  product_id text NOT NULL,
  price_id text NOT NULL,
  amount_cents integer,
  currency text,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lifetime_user ON public.lifetime_purchases(user_id);

ALTER TABLE public.lifetime_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own lifetime purchases"
  ON public.lifetime_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages lifetime purchases"
  ON public.lifetime_purchases FOR ALL
  USING (auth.role() = 'service_role');

-- Helper: tem PLUS vitalício?
CREATE OR REPLACE FUNCTION public.has_lifetime_plus(user_uuid uuid, check_env text DEFAULT 'live')
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lifetime_purchases
    WHERE user_id = user_uuid
      AND environment = check_env
      AND price_id = 'plus_vitalicio'
  );
$$;

-- Plano atual: 'pro' (assinatura ativa) > 'plus' (vitalício) > 'free'
CREATE OR REPLACE FUNCTION public.get_user_plan(user_uuid uuid, check_env text DEFAULT 'live')
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN public.has_active_subscription(user_uuid, check_env) THEN 'pro'
    WHEN public.has_lifetime_plus(user_uuid, check_env) THEN 'plus'
    ELSE 'free'
  END;
$$;

-- Acesso completo (PLUS ou PRO) — usado para gating de features pagas (não-IA)
CREATE OR REPLACE FUNCTION public.has_full_access(user_uuid uuid, check_env text DEFAULT 'live')
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_active_subscription(user_uuid, check_env)
      OR public.has_lifetime_plus(user_uuid, check_env);
$$;

-- IA só para PRO (assinatura ativa)
CREATE OR REPLACE FUNCTION public.has_ai_access(user_uuid uuid, check_env text DEFAULT 'live')
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_active_subscription(user_uuid, check_env);
$$;

-- Pode adicionar planta? (Free limitado a 3)
CREATE OR REPLACE FUNCTION public.can_add_plant(user_uuid uuid, check_env text DEFAULT 'live')
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.has_full_access(user_uuid, check_env)
    OR (SELECT count(*) FROM public.garden_plants WHERE user_id = user_uuid) < 3;
$$;

-- Bloqueia inserção de >3 plantas no plano Free (defesa server-side)
CREATE OR REPLACE FUNCTION public.enforce_plant_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.can_add_plant(NEW.user_id, 'live') THEN
    RAISE EXCEPTION 'PLANT_LIMIT_REACHED' USING HINT = 'Free plan limited to 3 plants. Upgrade to PLUS or PRO.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_plant_limit ON public.garden_plants;
CREATE TRIGGER trg_enforce_plant_limit
  BEFORE INSERT ON public.garden_plants
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plant_limit();

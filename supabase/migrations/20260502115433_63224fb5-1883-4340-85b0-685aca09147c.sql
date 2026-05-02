-- Função única de verdade para acesso completo (Premium + Trial).
-- Usa status REAL da assinatura Stripe (atualizado pelo webhook) e trial do profile.
CREATE OR REPLACE FUNCTION public.has_full_access(
  user_uuid uuid,
  check_env text DEFAULT 'live'
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- 1) Assinatura ativa real (status Stripe + price_id correto)
    EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE user_id = user_uuid
        AND environment = check_env
        AND price_id = 'premium_monthly'
        AND status IN ('active', 'trialing', 'past_due')
        AND (current_period_end IS NULL OR current_period_end > now())
    )
    OR
    -- 2) Trial gratuito ainda dentro da janela
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = user_uuid
        AND trial_expires_at IS NOT NULL
        AND trial_expires_at > now()
    );
$$;

-- Atualiza has_active_subscription para NUNCA considerar canceled como ativo
-- (cancelamento imediato; webhook é a fonte de verdade)
CREATE OR REPLACE FUNCTION public.has_active_subscription(
  user_uuid uuid,
  check_env text DEFAULT 'live'
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND environment = check_env
      AND status IN ('active', 'trialing', 'past_due')
      AND (current_period_end IS NULL OR current_period_end > now())
  );
$$;
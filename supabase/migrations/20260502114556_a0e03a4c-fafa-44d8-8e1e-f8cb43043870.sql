-- 1) Adiciona coluna trial_expires_at em profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;

-- 2) Para perfis existentes sem trial: define como já expirado
UPDATE public.profiles
SET trial_expires_at = created_at
WHERE trial_expires_at IS NULL;

-- 3) Atualiza a função handle_new_user para setar trial de 24h em novos cadastros
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, trial_expires_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    now() + interval '24 hours'
  );
  RETURN NEW;
END;
$function$;

-- 4) Garante o trigger on_auth_user_created (caso não exista)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
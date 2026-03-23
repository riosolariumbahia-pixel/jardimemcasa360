
-- ===========================================
-- JARDIM EM CASA 360 - SCHEMA COMPLETO
-- Isolamento total por user_id com RLS
-- ===========================================

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ===========================================
-- 1. PROFILES (dados do usuário)
-- ===========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- 2. GARDENS (hortas/locais do jardim)
-- ===========================================
CREATE TABLE public.gardens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  garden_type TEXT DEFAULT 'chao',
  light TEXT DEFAULT 'partial',
  wall_height NUMERIC,
  wall_width NUMERIC,
  containers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gardens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gardens"
  ON public.gardens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gardens"
  ON public.gardens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gardens"
  ON public.gardens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own gardens"
  ON public.gardens FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_gardens_user_id ON public.gardens(user_id);

CREATE TRIGGER update_gardens_updated_at
  BEFORE UPDATE ON public.gardens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- 3. GARDEN_PLANTS (plantas do jardim)
-- ===========================================
CREATE TABLE public.garden_plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  garden_id UUID REFERENCES public.gardens(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🌱',
  category TEXT,
  health INTEGER DEFAULT 80 CHECK (health >= 0 AND health <= 100),
  last_watered TIMESTAMPTZ,
  last_fertilized TIMESTAMPTZ,
  last_pruned TIMESTAMPTZ,
  needs_water BOOLEAN DEFAULT true,
  needs_fertilizer BOOLEAN DEFAULT true,
  needs_pruning BOOLEAN DEFAULT false,
  fertilizer_frequency TEXT,
  fertilizer_amount TEXT,
  water_frequency TEXT,
  light TEXT,
  difficulty TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.garden_plants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plants"
  ON public.garden_plants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plants"
  ON public.garden_plants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plants"
  ON public.garden_plants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plants"
  ON public.garden_plants FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_garden_plants_user_id ON public.garden_plants(user_id);
CREATE INDEX idx_garden_plants_garden_id ON public.garden_plants(garden_id);

CREATE TRIGGER update_garden_plants_updated_at
  BEFORE UPDATE ON public.garden_plants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- 4. TASKS (tarefas de rega, poda, adubação)
-- ===========================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID REFERENCES public.garden_plants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('water', 'fertilize', 'prune', 'other')),
  description TEXT,
  scheduled_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks"
  ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks"
  ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks"
  ON public.tasks FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_plant_id ON public.tasks(plant_id);
CREATE INDEX idx_tasks_scheduled_date ON public.tasks(scheduled_date);

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

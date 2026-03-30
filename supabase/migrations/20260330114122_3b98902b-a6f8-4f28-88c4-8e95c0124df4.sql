
-- Create enums for insights
CREATE TYPE public.insight_type AS ENUM ('alerta', 'recomendacao', 'previsao');
CREATE TYPE public.insight_priority AS ENUM ('baixa', 'media', 'alta');

-- Image analysis table
CREATE TABLE public.analises_imagem (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plant_id UUID REFERENCES public.garden_plants(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  ai_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence FLOAT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.analises_imagem ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own analyses" ON public.analises_imagem FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analyses" ON public.analises_imagem FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own analyses" ON public.analises_imagem FOR DELETE USING (auth.uid() = user_id);

-- AI interactions (chat history)
CREATE TABLE public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own interactions" ON public.ai_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interactions" ON public.ai_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own interactions" ON public.ai_interactions FOR DELETE USING (auth.uid() = user_id);

-- AI insights
CREATE TABLE public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type insight_type NOT NULL,
  description TEXT NOT NULL,
  priority insight_priority NOT NULL DEFAULT 'media',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own insights" ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights" ON public.ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own insights" ON public.ai_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own insights" ON public.ai_insights FOR DELETE USING (auth.uid() = user_id);

-- Weather cache
CREATE TABLE public.weather_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  temperature FLOAT,
  humidity FLOAT,
  rain_forecast BOOLEAN DEFAULT false,
  ref_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(city, ref_date)
);
ALTER TABLE public.weather_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read weather" ON public.weather_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert weather" ON public.weather_cache FOR INSERT TO authenticated WITH CHECK (true);

-- Storage bucket for plant images
INSERT INTO storage.buckets (id, name, public) VALUES ('plant-images', 'plant-images', true)
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Users can upload plant images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'plant-images');
CREATE POLICY "Anyone can view plant images" ON storage.objects FOR SELECT USING (bucket_id = 'plant-images');


-- Fix weather cache policies to be more restrictive
DROP POLICY IF EXISTS "Anyone can insert weather" ON public.weather_cache;
CREATE POLICY "Service can insert weather" ON public.weather_cache FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

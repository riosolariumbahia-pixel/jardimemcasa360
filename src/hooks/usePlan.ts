import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getStripeEnvironment } from "@/lib/stripe";
import { useSubscription } from "@/hooks/useSubscription";

export type PlanTier = "free" | "plus" | "pro";

const FREE_PLANT_LIMIT = 3;
const FREE_GARDEN_LIMIT = 1;

export interface PlanInfo {
  loading: boolean;
  plan: PlanTier;
  isFree: boolean;
  isPlus: boolean;
  isPro: boolean;
  /** Acesso a recursos pagos (PLUS ou PRO). */
  hasFullAccess: boolean;
  /** Acesso a IA (somente PRO). */
  hasAI: boolean;
  plantCount: number;
  plantLimit: number | null; // null = ilimitado
  gardenLimit: number | null;
  canAddPlant: boolean;
  refetch: () => void;
}

export function usePlan(): PlanInfo {
  const { user } = useAuth();
  const sub = useSubscription();
  const [hasLifetime, setHasLifetime] = useState(false);
  const [plantCount, setPlantCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
      setHasLifetime(false);
      setPlantCount(0);
      setLoading(false);
      return;
    }
    const env = getStripeEnvironment();
    const [{ data: lifetimeRows }, { count }] = await Promise.all([
      supabase
        .from("lifetime_purchases" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("environment", env)
        .limit(1),
      supabase
        .from("garden_plants")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);
    setHasLifetime(!!lifetimeRows && lifetimeRows.length > 0);
    setPlantCount(count ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const isPro = sub.isPremium;
  const isPlus = !isPro && hasLifetime;
  const isFree = !isPro && !isPlus;
  const plan: PlanTier = isPro ? "pro" : isPlus ? "plus" : "free";

  const plantLimit = isFree ? FREE_PLANT_LIMIT : null;
  const gardenLimit = isFree ? FREE_GARDEN_LIMIT : null;
  const canAddPlant = !isFree || plantCount < FREE_PLANT_LIMIT;

  return {
    loading: sub.loading || loading,
    plan,
    isFree,
    isPlus,
    isPro,
    hasFullAccess: isPlus || isPro,
    hasAI: isPro,
    plantCount,
    plantLimit,
    gardenLimit,
    canAddPlant,
    refetch: fetchData,
  };
}

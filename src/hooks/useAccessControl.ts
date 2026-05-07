import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { getStripeEnvironment } from "@/lib/stripe";

export interface AccessInfo {
  loading: boolean;
  isPremium: boolean;     // PRO (assinatura ativa)
  isOnTrial: boolean;     // mantido por compatibilidade — sempre false agora
  trialExpiresAt: string | null;
  trialMsRemaining: number;
  hasFullAccess: boolean; // PLUS vitalício OU PRO
}

/**
 * Controle de acesso (compatibilidade): hasFullAccess = PLUS vitalício OU PRO.
 * Trial removido conforme o novo modelo Free puro com 3 plantas.
 */
export function useAccessControl(): AccessInfo {
  const { user, loading: authLoading } = useAuth();
  const sub = useSubscription();
  const [hasLifetime, setHasLifetime] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLifetime = useCallback(async () => {
    if (!user) {
      setHasLifetime(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("lifetime_purchases" as any)
      .select("id")
      .eq("user_id", user.id)
      .eq("environment", getStripeEnvironment())
      .limit(1);
    setHasLifetime(!!data && data.length > 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void fetchLifetime();
  }, [fetchLifetime]);

  const hasFullAccess = sub.isPremium || hasLifetime;

  return {
    loading: authLoading || sub.loading || loading,
    isPremium: sub.isPremium,
    isOnTrial: false,
    trialExpiresAt: null,
    trialMsRemaining: 0,
    hasFullAccess,
  };
}

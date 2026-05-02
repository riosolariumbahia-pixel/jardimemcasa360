import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";

export interface AccessInfo {
  loading: boolean;
  isPremium: boolean;
  isOnTrial: boolean;
  trialExpiresAt: string | null;
  trialMsRemaining: number;
  hasFullAccess: boolean; // trial ativo OU assinante
}

/**
 * Controle global de acesso:
 * - hasFullAccess = true se o usuário está dentro do trial OU tem assinatura ativa
 * - O trial é de 24h a partir do cadastro, definido UMA vez via trigger no banco
 *   (anti-burla: nunca é resetado em logout/login)
 */
export function useAccessControl(): AccessInfo {
  const { user, loading: authLoading } = useAuth();
  const sub = useSubscription();
  const [trialExpiresAt, setTrialExpiresAt] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setTrialExpiresAt(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("trial_expires_at")
      .eq("user_id", user.id)
      .maybeSingle();
    setTrialExpiresAt((data as any)?.trial_expires_at ?? null);
    setProfileLoading(false);
  }, [user]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  // Atualiza "agora" a cada minuto para o countdown do trial.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const trialMs = trialExpiresAt ? new Date(trialExpiresAt).getTime() - now : 0;
  const isOnTrial = trialMs > 0;
  const hasFullAccess = sub.isPremium || isOnTrial;

  return {
    loading: authLoading || sub.loading || profileLoading,
    isPremium: sub.isPremium,
    isOnTrial,
    trialExpiresAt,
    trialMsRemaining: Math.max(0, trialMs),
    hasFullAccess,
  };
}

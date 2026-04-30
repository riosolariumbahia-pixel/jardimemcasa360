import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getStripeEnvironment } from "@/lib/stripe";

export interface SubscriptionInfo {
  isPremium: boolean;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  loading: boolean;
}

const PREMIUM_PRICE_IDS = new Set(["premium_monthly"]);

function isActiveStatus(status: string | null, end: string | null): boolean {
  if (!status) return false;
  const future = !end || new Date(end).getTime() > Date.now();
  if (["active", "trialing", "past_due"].includes(status) && future) return true;
  if (status === "canceled" && future) return true;
  return false;
}

export function useSubscription(): SubscriptionInfo & { refetch: () => void } {
  const { user } = useAuth();
  const [info, setInfo] = useState<SubscriptionInfo>({
    isPremium: false,
    status: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    loading: true,
  });

  const fetchSub = useCallback(async () => {
    if (!user) {
      setInfo({ isPremium: false, status: null, currentPeriodEnd: null, cancelAtPeriodEnd: false, loading: false });
      return;
    }
    const { data } = await supabase
      .from("subscriptions")
      .select("status, current_period_end, cancel_at_period_end, price_id")
      .eq("user_id", user.id)
      .eq("environment", getStripeEnvironment())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const status = data?.status ?? null;
    const end = data?.current_period_end ?? null;
    const isPremium = !!data && PREMIUM_PRICE_IDS.has(data.price_id) && isActiveStatus(status, end);

    setInfo({
      isPremium,
      status,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: !!data?.cancel_at_period_end,
      loading: false,
    });
  }, [user]);

  useEffect(() => {
    void fetchSub();
  }, [fetchSub]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`subs-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => void fetchSub(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, fetchSub]);

  return { ...info, refetch: fetchSub };
}
